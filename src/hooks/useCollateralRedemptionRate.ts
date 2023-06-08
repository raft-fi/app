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
import { COLLATERAL_BASE_TOKEN, DEBOUNCE_IN_MS, POLLING_INTERVAL_IN_MS } from '../constants';
import { Nullable } from '../interfaces';
import { provider$ } from './useProvider';

const CL_DEVIATION = 0.01; // 1%

// TODO - We currently only have one underlying collateral (wstETH), once we add more,
//we need to store redemption rate for each underlying collateral separately

export const collateralRedemptionRate$ = new BehaviorSubject<Nullable<Decimal>>(null);

const fetchData = (collateralToken: UnderlyingCollateralToken, provider: JsonRpcProvider) => {
  try {
    const stats = Protocol.getInstance(provider);

    return from(stats.fetchRedemptionRate(collateralToken)).pipe(
      catchError(error => {
        console.error(
          `useCollateralRedemptionFee - failed to fetch redemption fee for collateral '${collateralToken}'`,
          error,
        );
        return of(null);
      }),
    );
  } catch (error) {
    console.error(
      `useCollateralRedemptionFee - failed to fetch redemption fee for collateral '${collateralToken}'`,
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
    return fetchData(COLLATERAL_BASE_TOKEN, provider);
  }),
);

// merge all stream$ into one if there are multiple
const stream$ = merge(periodicStream$).pipe(
  debounce<Nullable<Decimal>>(() => interval(DEBOUNCE_IN_MS)),
  tap(rate => {
    collateralRedemptionRate$.next(rate ? rate.add(CL_DEVIATION) : null);
  }),
);

export const [useCollateralRedemptionRate] = bind(collateralRedemptionRate$, null);

let subscription: Subscription;

export const subscribeCollateralRedemptionRate = (): void => {
  unsubscribeCollateralRedemptionRate();
  subscription = stream$.subscribe();
};
export const unsubscribeCollateralRedemptionRate = (): void => subscription?.unsubscribe();
export const resetCollateralRedemptionRate = (): void => {
  collateralRedemptionRate$.next(null);
};
