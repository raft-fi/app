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
import { DEBOUNCE_IN_MS, LONG_POLLING_INTERVAL_IN_MS, SUPPORTED_COLLATERAL_TOKENS } from '../constants';
import { Nullable, SupportedCollateralToken, TokenDecimalMap } from '../interfaces';
import { provider$ } from './useProvider';
import { Decimal } from '@tempusfinance/decimal';
import { getNullTokenMap } from '../utils';

export type CollateralProtocolCapMap = TokenDecimalMap<SupportedCollateralToken>;

const DEFAULT_VALUE: CollateralProtocolCapMap = getNullTokenMap<SupportedCollateralToken>(SUPPORTED_COLLATERAL_TOKENS);

export const collateralProtocolCaps$ = new BehaviorSubject<CollateralProtocolCapMap>(DEFAULT_VALUE);

const fetchData = (protocol: Protocol, collateralToken: SupportedCollateralToken): Observable<Nullable<Decimal>> => {
  try {
    return from(protocol.getTotalCollateralCap(collateralToken)).pipe(
      map(cap => cap ?? Decimal.MAX_DECIMAL),
      catchError(error => {
        console.error('useCollateralProtocolCaps (catchError) - failed to fetch protocol collateral cap', error);
        return of(null);
      }),
    );
  } catch (error) {
    console.error('useCollateralProtocolCaps (error) - failed to fetch protocol collateral cap', error);
    return of(null);
  }
};

// only poll once per hour
const intervalBeat$: Observable<number> = interval(LONG_POLLING_INTERVAL_IN_MS).pipe(startWith(0));

// stream$ for periodic polling to fetch data
const periodicStream$: Observable<CollateralProtocolCapMap> = intervalBeat$.pipe(
  withLatestFrom(provider$),
  mergeMap<[number, JsonRpcProvider], Observable<CollateralProtocolCapMap>>(([, provider]) => {
    const protocol = Protocol.getInstance(provider);

    const collateralProtocolCapMaps = SUPPORTED_COLLATERAL_TOKENS.map(collateralToken =>
      from(fetchData(protocol, collateralToken)).pipe(
        map(
          cap =>
            ({
              [collateralToken]: cap,
            } as CollateralProtocolCapMap),
        ),
      ),
    );

    return merge(...collateralProtocolCapMaps);
  }),
);

const stream$ = periodicStream$.pipe(
  scan(
    (allCollateralProtocolCaps, collateralProtocolCaps) => ({
      ...allCollateralProtocolCaps,
      ...collateralProtocolCaps,
    }),
    {} as CollateralProtocolCapMap,
  ),
  debounce<CollateralProtocolCapMap>(() => interval(DEBOUNCE_IN_MS)),
  tap(allCollateralProtocolCaps => collateralProtocolCaps$.next(allCollateralProtocolCaps)),
);

export const [useCollateralProtocolCaps] = bind(collateralProtocolCaps$, DEFAULT_VALUE);

let subscription: Subscription;

export const subscribeCollateralProtocolCaps = (): void => {
  unsubscribeCollateralProtocolCaps();
  subscription = stream$.subscribe();
};
export const unsubscribeCollateralProtocolCaps = (): void => subscription?.unsubscribe();
export const resetCollateralProtocolCaps = (): void => {
  collateralProtocolCaps$.next(DEFAULT_VALUE);
};
