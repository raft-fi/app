import { JsonRpcProvider } from 'ethers';
import { bind } from '@react-rxjs/core';
import { Savings } from '@raft-fi/sdk';
import { Decimal } from '@tempusfinance/decimal';
import {
  from,
  of,
  merge,
  tap,
  filter,
  Observable,
  catchError,
  debounce,
  interval,
  Subscription,
  concatMap,
  BehaviorSubject,
  map,
  withLatestFrom,
} from 'rxjs';
import { DEBOUNCE_IN_MS, POLLING_INTERVAL_IN_MS } from '../constants';
import { Nullable } from '../interfaces';
import { provider$ } from './useProvider';

export const savingsMaxDeposit$ = new BehaviorSubject<Nullable<Decimal>>(null);

const intervalBeat$: Observable<number> = interval(POLLING_INTERVAL_IN_MS);

const fetchData = (provider: JsonRpcProvider) => {
  try {
    const savings = new Savings(provider);

    return from(savings.maxDeposit()).pipe(
      map(maxDeposit => {
        return maxDeposit;
      }),
      catchError(error => {
        console.error('useSavingsMaxDeposit (catchError) - failed to fetch savings max deposit!', error);
        return of(null);
      }),
    );
  } catch (error) {
    console.error('useSavingsMaxDeposit (catch) - failed to fetch savings max deposit!', error);
    return of(null);
  }
};

// Stream that fetches protocol stats periodically
const intervalStream$ = intervalBeat$.pipe(
  withLatestFrom(provider$),
  concatMap<[number, JsonRpcProvider], Observable<Nullable<Decimal>>>(([, provider]) => fetchData(provider)),
);

// Stream that fetches savings max deposit every time provider changes
const providerStream$ = provider$.pipe(
  concatMap<JsonRpcProvider, Observable<Nullable<Decimal>>>(provider => fetchData(provider)),
);

// merge all stream$ into one if there are multiple
const stream$ = merge(providerStream$, intervalStream$).pipe(
  filter((savingsMaxDeposit): savingsMaxDeposit is Decimal => Boolean(savingsMaxDeposit)),
  debounce<Decimal>(() => interval(DEBOUNCE_IN_MS)),
  tap(savingsMaxDeposit => {
    savingsMaxDeposit$.next(savingsMaxDeposit);
  }),
);

export const [useSavingsMaxDeposit] = bind(savingsMaxDeposit$, null);

let subscription: Subscription;

export const subscribeSavingsMaxDeposit = (): void => {
  unsubscribeSavingsMaxDeposit();
  subscription = stream$.subscribe();
};
export const unsubscribeSavingsMaxDeposit = (): void => subscription?.unsubscribe();
export const resetSavingsMaxDeposit = (): void => {
  savingsMaxDeposit$.next(null);
};
