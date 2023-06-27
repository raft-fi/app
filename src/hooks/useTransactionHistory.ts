import { JsonRpcSigner } from 'ethers';
import { bind } from '@react-rxjs/core';
import { PositionTransaction, UserPosition } from '@raft-fi/sdk';
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
  startWith,
  withLatestFrom,
} from 'rxjs';
import { DEBOUNCE_IN_MS, POLLING_INTERVAL_IN_MS, SUPPORTED_UNDERLYING_TOKENS } from '../constants';
import { Nullable } from '../interfaces';
import { appEvent$ } from './useAppEvent';
import { walletSigner$ } from './useWalletSigner';

const transactionHistory$ = new BehaviorSubject<Nullable<PositionTransaction[]>>(null);

const intervalBeat$: Observable<number> = interval(POLLING_INTERVAL_IN_MS).pipe(startWith(0));

const fetchData = (walletSigner: Nullable<JsonRpcSigner>) => {
  if (!walletSigner) {
    return of([]);
  }

  try {
    const userPosition = new UserPosition(walletSigner, undefined, undefined, SUPPORTED_UNDERLYING_TOKENS[0]);

    return from(userPosition.getTransactions()).pipe(
      catchError(error => {
        console.error('useTransactionHistory - failed to fetch transaction history', error);
        return of(null);
      }),
    );
  } catch (error) {
    console.error('useTransactionHistory - failed to fetch transaction history', error);
    return of(null);
  }
};

// Stream that fetches on wallet change
const walletChangeStream$ = walletSigner$.pipe(concatMap(walletSigner => fetchData(walletSigner)));

// Stream that fetches transaction history periodically
const intervalStream$ = intervalBeat$.pipe(
  withLatestFrom(walletSigner$),
  concatMap<[number, Nullable<JsonRpcSigner>], Observable<Nullable<PositionTransaction[]>>>(([, walletSigner]) =>
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
  filter((transactions): transactions is PositionTransaction[] => Boolean(transactions)),
  debounce<PositionTransaction[]>(() => interval(DEBOUNCE_IN_MS)),
  tap(transactions => {
    transactionHistory$.next(transactions);
  }),
);

export const [useTransactionHistory] = bind(transactionHistory$, null);

let subscription: Subscription;

export const subscribeTransactionHistory = (): void => {
  unsubscribeTransactionHistory();
  subscription = stream$.subscribe();
};
export const unsubscribeTransactionHistory = (): void => subscription?.unsubscribe();
export const resetTransactionHistory = (): void => {
  transactionHistory$.next(null);
};
