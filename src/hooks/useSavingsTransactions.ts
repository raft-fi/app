import { JsonRpcSigner } from 'ethers';
import { bind } from '@react-rxjs/core';
import { SavingsTransaction, UserSavings } from '@raft-fi/sdk';
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
  withLatestFrom,
} from 'rxjs';
import { DEBOUNCE_IN_MS, POLLING_INTERVAL_IN_MS } from '../constants';
import { Nullable } from '../interfaces';
import { appEvent$ } from './useAppEvent';
import { walletSigner$ } from './useWalletSigner';

export const savingsTransactions$ = new BehaviorSubject<Nullable<SavingsTransaction[]>>(null);

const intervalBeat$: Observable<number> = interval(POLLING_INTERVAL_IN_MS);

const fetchData = (walletSigner: Nullable<JsonRpcSigner>) => {
  if (!walletSigner) {
    return of([]);
  }

  try {
    const userSavings = new UserSavings(walletSigner);

    return from(userSavings.getSavingsTransactions()).pipe(
      catchError(error => {
        console.error('useSavingsTransactions - failed to fetch savings transactions', error);
        return of(null);
      }),
    );
  } catch (error) {
    console.error('useSavingsTransactions - failed to fetch savings transactions', error);
    return of(null);
  }
};

// Stream that fetches on wallet change
const walletChangeStream$ = walletSigner$.pipe(concatMap(walletSigner => fetchData(walletSigner)));

// Stream that fetches transaction history periodically
const intervalStream$ = intervalBeat$.pipe(
  withLatestFrom(walletSigner$),
  concatMap<[number, Nullable<JsonRpcSigner>], Observable<Nullable<SavingsTransaction[]>>>(([, walletSigner]) =>
    fetchData(walletSigner),
  ),
);

// fetch when app event fire
const appEventsStream$ = appEvent$.pipe(
  withLatestFrom(walletSigner$),
  concatMap(([, walletSigner]) => fetchData(walletSigner)),
);

// merge all stream$ into one if there are multiple
const stream$ = merge(intervalStream$, appEventsStream$, walletChangeStream$).pipe(
  filter((transactions): transactions is SavingsTransaction[] => Boolean(transactions)),
  debounce<SavingsTransaction[]>(() => interval(DEBOUNCE_IN_MS)),
  tap(transactions => {
    savingsTransactions$.next(transactions);
  }),
);

export const [useSavingsTransactions] = bind(savingsTransactions$, null);

let subscription: Subscription;

export const subscribeSavingsTransactions = (): void => {
  unsubscribeSavingsTransactions();
  subscription = stream$.subscribe();
};
export const unsubscribeSavingsTransactions = (): void => subscription?.unsubscribe();
export const resetSavingsTransactions = (): void => {
  savingsTransactions$.next(null);
};
