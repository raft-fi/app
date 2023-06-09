import { PriceFeed, Protocol, UnderlyingCollateralToken } from '@raft-fi/sdk';
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
import { COLLATERAL_BASE_TOKEN, DEBOUNCE_IN_MS, DISPLAY_BASE_TOKEN, POLLING_INTERVAL_IN_MS } from '../constants';
import { Nullable } from '../interfaces';
import { provider$ } from './useProvider';
import { priceFeed$ } from './usePriceFeed';

export const collateralConversionRate$ = new BehaviorSubject<Nullable<Decimal>>(null);

const fetchData = (feed: PriceFeed) => {
  try {
    return from(feed.getUnderlyingToCollateralRate(COLLATERAL_BASE_TOKEN, DISPLAY_BASE_TOKEN)).pipe(
      catchError(error => {
        console.error(
          `useCollateralConversionRate - failed to fetch conversion rate from ${COLLATERAL_BASE_TOKEN} to ${DISPLAY_BASE_TOKEN}!`,
          error,
        );
        return of(null);
      }),
    );
  } catch (error) {
    console.error(
      `useCollateralConversionRate - failed to fetch conversion rate from ${COLLATERAL_BASE_TOKEN} to ${DISPLAY_BASE_TOKEN}!`,
      error,
    );
    return of(null);
  }
};

const intervalBeat$: Observable<number> = interval(POLLING_INTERVAL_IN_MS).pipe(startWith(0));

// stream$ for periodic polling to fetch data
const periodicStream$: Observable<Nullable<Decimal>> = intervalBeat$.pipe(
  withLatestFrom(priceFeed$),
  mergeMap<[number, PriceFeed], Observable<Nullable<Decimal>>>(([, priceFeed]) => {
    return fetchData(priceFeed);
  }),
);

// merge all stream$ into one if there are multiple
const stream$ = merge(periodicStream$).pipe(
  debounce<Nullable<Decimal>>(() => interval(DEBOUNCE_IN_MS)),
  tap(conversionRate => {
    collateralConversionRate$.next(conversionRate);
  }),
);

export const [useCollateralConversionRate] = bind(collateralConversionRate$, null);

let subscription: Subscription;

export const subscribeCollateralConversionRate = (): void => {
  unsubscribeCollateralConversionRate();
  subscription = stream$.subscribe();
};
export const unsubscribeCollateralConversionRate = (): void => subscription?.unsubscribe();
export const resetCollateralConversionRate = (): void => {
  collateralConversionRate$.next(null);
};
