import { Protocol } from '@raft-fi/sdk';
import { bind } from '@react-rxjs/core';
import {
  from,
  of,
  merge,
  tap,
  scan,
  map,
  Observable,
  catchError,
  debounce,
  interval,
  Subscription,
  BehaviorSubject,
  withLatestFrom,
  startWith,
  mergeMap,
} from 'rxjs';
import { JsonRpcProvider } from 'ethers';
import { DEBOUNCE_IN_MS, POLLING_INTERVAL_IN_MS, SUPPORTED_COLLATERAL_TOKENS } from '../constants';
import { Nullable, SupportedCollateralToken, TokenDecimalMap } from '../interfaces';
import { provider$ } from './useProvider';
import { Decimal } from '@tempusfinance/decimal';
import { getNullTokenMap } from '../utils';

export type CollateralPositionCapMap = TokenDecimalMap<SupportedCollateralToken>;

const DEFAULT_VALUE: CollateralPositionCapMap = getNullTokenMap<SupportedCollateralToken>(SUPPORTED_COLLATERAL_TOKENS);

export const collateralPositionCaps$ = new BehaviorSubject<CollateralPositionCapMap>(DEFAULT_VALUE);

const fetchData = (protocol: Protocol, collateralToken: SupportedCollateralToken): Observable<Nullable<Decimal>> => {
  try {
    return from(protocol.getPositionCollateralCap(collateralToken)).pipe(
      map(cap => cap ?? Decimal.MAX_DECIMAL),
      catchError(error => {
        console.error('useCollateralPositionCaps (catchError) - failed to fetch position collateral cap', error);
        return of(null);
      }),
    );
  } catch (error) {
    console.error('useCollateralPositionCaps (error) - failed to fetch position collateral cap', error);
    return of(null);
  }
};

const intervalBeat$: Observable<number> = interval(POLLING_INTERVAL_IN_MS).pipe(startWith(0));

// stream$ for periodic polling to fetch data
const periodicStream$: Observable<CollateralPositionCapMap> = intervalBeat$.pipe(
  withLatestFrom(provider$),
  mergeMap<[number, JsonRpcProvider], Observable<CollateralPositionCapMap>>(([, provider]) => {
    const protocol = Protocol.getInstance(provider);

    const collateralPositionCapMaps = SUPPORTED_COLLATERAL_TOKENS.map(collateralToken =>
      from(fetchData(protocol, collateralToken)).pipe(
        map(
          cap =>
            ({
              [collateralToken]: cap,
            } as CollateralPositionCapMap),
        ),
      ),
    );

    return merge(...collateralPositionCapMaps);
  }),
);

const stream$ = periodicStream$.pipe(
  scan(
    (allCollateralPositionCaps, collateralPositionCaps) => ({
      ...allCollateralPositionCaps,
      ...collateralPositionCaps,
    }),
    {} as CollateralPositionCapMap,
  ),
  debounce<CollateralPositionCapMap>(() => interval(DEBOUNCE_IN_MS)),
  tap(allCollateralPositionCaps => collateralPositionCaps$.next(allCollateralPositionCaps)),
);

export const [useCollateralPositionCaps] = bind(collateralPositionCaps$, DEFAULT_VALUE);

let subscription: Subscription;

export const subscribeCollateralPositionCaps = (): void => {
  unsubscribeCollateralPositionCaps();
  subscription = stream$.subscribe();
};
export const unsubscribeCollateralPositionCaps = (): void => subscription?.unsubscribe();
export const resetCollateralPositionCaps = (): void => {
  collateralPositionCaps$.next(DEFAULT_VALUE);
};
