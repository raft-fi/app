import { Protocol } from '@raft-fi/sdk';
import { bind } from '@react-rxjs/core';
import {
  from,
  of,
  merge,
  tap,
  scan,
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
import { DEBOUNCE_IN_MS, POLLING_INTERVAL_IN_MS, SUPPORTED_UNDERLYING_TOKENS } from '../constants';
import { SupportedUnderlyingCollateralToken, TokenDecimalMap } from '../interfaces';
import { provider$ } from './useProvider';
import { getNullTokenMap } from '../utils';

export type CollateralBorrowingRateMap = TokenDecimalMap<SupportedUnderlyingCollateralToken>;

const DEFAULT_VALUE: CollateralBorrowingRateMap =
  getNullTokenMap<SupportedUnderlyingCollateralToken>(SUPPORTED_UNDERLYING_TOKENS);

export const collateralBorrowingRates$ = new BehaviorSubject<CollateralBorrowingRateMap>(DEFAULT_VALUE);

const fetchData = (provider: JsonRpcProvider) => {
  try {
    const stats = Protocol.getInstance(provider);

    return from(stats.fetchBorrowingRate()).pipe(
      catchError(error => {
        console.error('useCollateralBorrowingFee (catchError) - failed to fetch borrowing fee', error);
        return of(DEFAULT_VALUE);
      }),
    );
  } catch (error) {
    console.error('useCollateralBorrowingFee (error) - failed to fetch borrowing fee', error);
    return of(DEFAULT_VALUE);
  }
};

const intervalBeat$: Observable<number> = interval(POLLING_INTERVAL_IN_MS).pipe(startWith(0));

// stream$ for periodic polling to fetch data
const periodicStream$: Observable<CollateralBorrowingRateMap> = intervalBeat$.pipe(
  withLatestFrom(provider$),
  mergeMap<[number, JsonRpcProvider], Observable<CollateralBorrowingRateMap>>(([, provider]) => fetchData(provider)),
);

// merge all stream$ into one if there are multiple
const stream$ = merge(periodicStream$).pipe(
  scan(
    (allCollateralBorrowingRates, collateralBorrowingRates) => ({
      ...allCollateralBorrowingRates,
      ...collateralBorrowingRates,
    }),
    {} as CollateralBorrowingRateMap,
  ),
  debounce<CollateralBorrowingRateMap>(() => interval(DEBOUNCE_IN_MS)),
  tap(allCollateralBorrowingRates => collateralBorrowingRates$.next(allCollateralBorrowingRates)),
);

export const [useCollateralBorrowingRates] = bind(collateralBorrowingRates$, DEFAULT_VALUE);

let subscription: Subscription;

export const subscribeCollateralBorrowingRates = (): void => {
  unsubscribeCollateralBorrowingRates();
  subscription = stream$.subscribe();
};
export const unsubscribeCollateralBorrowingRates = (): void => subscription?.unsubscribe();
export const resetCollateralBorrowingRates = (): void => {
  collateralBorrowingRates$.next(DEFAULT_VALUE);
};
