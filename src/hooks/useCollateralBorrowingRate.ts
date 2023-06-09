import { Protocol, UnderlyingCollateralToken } from '@raft-fi/sdk';
import { bind } from '@react-rxjs/core';
import {
  from,
  of,
  merge,
  tap,
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
import { Decimal } from '@tempusfinance/decimal';
import { JsonRpcProvider } from 'ethers';
import { DEBOUNCE_IN_MS, POLLING_INTERVAL_IN_MS } from '../constants';
import { Nullable } from '../interfaces';
import { provider$ } from './useProvider';

// TODO - We currently only have one underlying collateral (wstETH), once we add more,
//we need to store borrowing rate for each underlying collateral separately

export const collateralBorrowingRate$ = new BehaviorSubject<Nullable<Decimal>>(null);

const fetchData = (collateralToken: UnderlyingCollateralToken, provider: JsonRpcProvider) => {
  try {
    const stats = Protocol.getInstance(provider);

    return from(stats.fetchBorrowingRate(collateralToken)).pipe(
      catchError(error => {
        console.error(
          `useCollateralBorrowingFee - failed to fetch borrowing fee for collateral '${collateralToken}'`,
          error,
        );
        return of(null);
      }),
    );
  } catch (error) {
    console.error(
      `useCollateralBorrowingFee - failed to fetch borrowing fee for collateral '${collateralToken}'`,
      error,
    );
    return of(null);
  }
};

const intervalBeat$: Observable<number> = interval(POLLING_INTERVAL_IN_MS).pipe(startWith(0));

// stream$ for periodic polling to fetch data
const periodicStream$: Observable<Nullable<Decimal>> = intervalBeat$.pipe(
  withLatestFrom(provider$),
  mergeMap<[number, JsonRpcProvider], Observable<Nullable<Decimal>>>(([, provider]) => {
    return fetchData('wstETH', provider);
  }),
);

// merge all stream$ into one if there are multiple
const stream$ = merge(periodicStream$).pipe(
  debounce<Nullable<Decimal>>(() => interval(DEBOUNCE_IN_MS)),
  tap(balance => {
    collateralBorrowingRate$.next(balance);
  }),
);

export const [useCollateralBorrowingRate] = bind(collateralBorrowingRate$, null);

let subscription: Subscription;

export const subscribeCollateralBorrowingRate = (): void => {
  unsubscribeCollateralBorrowingRate();
  subscription = stream$.subscribe();
};
export const unsubscribeCollateralBorrowingRate = (): void => subscription?.unsubscribe();
export const resetCollateralBorrowingRate = (): void => {
  collateralBorrowingRate$.next(null);
};
