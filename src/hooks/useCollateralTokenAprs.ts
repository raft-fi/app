import { bind } from '@react-rxjs/core';
import {
  from,
  merge,
  tap,
  scan,
  map,
  Observable,
  debounce,
  interval,
  Subscription,
  BehaviorSubject,
  startWith,
  mergeMap,
} from 'rxjs';
import { request, gql } from 'graphql-request';
import { DEBOUNCE_IN_MS, POLLING_INTERVAL_IN_MS, SUPPORTED_COLLATERAL_TOKENS } from '../constants';
import { Nullable, SupportedCollateralToken, TokenDecimalMap } from '../interfaces';
import { Decimal } from '@tempusfinance/decimal';
import { getNullTokenMap } from '../utils';

export type CollateralAprMap = TokenDecimalMap<SupportedCollateralToken>;
interface SubgraphAprResponse {
  totalRewards: {
    apr: string;
  }[];
}

const DEFAULT_VALUE: CollateralAprMap = getNullTokenMap<SupportedCollateralToken>(SUPPORTED_COLLATERAL_TOKENS);

export const collateralTokenAprs$ = new BehaviorSubject<CollateralAprMap>(DEFAULT_VALUE);

const fetchData = async (collateralToken: SupportedCollateralToken): Promise<Nullable<Decimal>> => {
  try {
    switch (collateralToken) {
      case 'stETH':
      case 'wstETH': {
        const STETH_APR_SUBGRAPH_URL = import.meta.env.VITE_STETH_APR_SUBGRAPH_URL;

        if (!STETH_APR_SUBGRAPH_URL) {
          return null;
        }

        const query = gql`
          {
            totalRewards(first: 7, orderBy: block, orderDirection: desc) {
              apr
            }
          }
        `;

        const response = await request<SubgraphAprResponse>(STETH_APR_SUBGRAPH_URL, query);

        if (!response.totalRewards.length) {
          return Decimal.ZERO;
        }

        const averageApr =
          response.totalRewards.reduce((aggregatedValue, currentValue) => {
            return Number(aggregatedValue) + Number(currentValue.apr);
          }, 0) /
          (response.totalRewards.length * 100);

        return new Decimal(averageApr);
      }
      case 'rETH':
        // TODO: no ideas how to fetch rETH's APR
        return Decimal.ZERO;
      default:
        return Decimal.ZERO;
    }
  } catch (error) {
    console.error('useCollateralTokenAprs (error) - failed to fetch protocol collateral cap', error);
    return null;
  }
};

const intervalBeat$: Observable<number> = interval(POLLING_INTERVAL_IN_MS).pipe(startWith(0));

// stream$ for periodic polling to fetch data
const periodicStream$: Observable<CollateralAprMap> = intervalBeat$.pipe(
  mergeMap<number, Observable<CollateralAprMap>>(() => {
    const collateralAprMaps = SUPPORTED_COLLATERAL_TOKENS.map(collateralToken =>
      from(fetchData(collateralToken)).pipe(
        map(
          cap =>
            ({
              [collateralToken]: cap,
            } as CollateralAprMap),
        ),
      ),
    );

    return merge(...collateralAprMaps);
  }),
);

const stream$ = periodicStream$.pipe(
  scan(
    (allCollateralTokenAprs, collateralTokenAprs) => ({
      ...allCollateralTokenAprs,
      ...collateralTokenAprs,
    }),
    {} as CollateralAprMap,
  ),
  debounce<CollateralAprMap>(() => interval(DEBOUNCE_IN_MS)),
  tap(allCollateralTokenAprs => collateralTokenAprs$.next(allCollateralTokenAprs)),
);

export const [useCollateralTokenAprs] = bind(collateralTokenAprs$, DEFAULT_VALUE);

let subscription: Subscription;

export const subscribeCollateralTokenAprs = (): void => {
  unsubscribeCollateralTokenAprs();
  subscription = stream$.subscribe();
};
export const unsubscribeCollateralTokenAprs = (): void => subscription?.unsubscribe();
export const resetCollateralTokenAprs = (): void => {
  collateralTokenAprs$.next(DEFAULT_VALUE);
};
