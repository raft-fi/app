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

export const savingsYield$ = new BehaviorSubject<Nullable<Decimal>>(null);

const intervalBeat$: Observable<number> = interval(POLLING_INTERVAL_IN_MS);

const fetchData = (provider: JsonRpcProvider) => {
  try {
    const savings = new Savings(provider);

    return from(savings.getCurrentYield()).pipe(
      map(currentYield => currentYield),
      catchError(error => {
        console.error('useSavingsYield (catchError) - failed to fetch savings yield value!', error);
        return of(null);
      }),
    );
  } catch (error) {
    console.error('useSavingsYield (catch) - failed to fetch savings yield value!', error);
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
  filter((savingsTvl): savingsTvl is Decimal => Boolean(savingsTvl)),
  debounce<Decimal>(() => interval(DEBOUNCE_IN_MS)),
  tap(savingsYield => {
    savingsYield$.next(savingsYield);
  }),
);

export const [useSavingsYield] = bind(savingsYield$, null);

let subscription: Subscription;

export const subscribeSavingsYield = (): void => {
  unsubscribeSavingsYield();
  subscription = stream$.subscribe();
};
export const unsubscribeSavingsYield = (): void => subscription?.unsubscribe();
export const resetSavingsYield = (): void => {
  savingsYield$.next(null);
};
