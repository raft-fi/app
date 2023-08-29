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

export const manageTransactions$ = new BehaviorSubject<Nullable<PositionTransaction[]>>(null);

const intervalBeat$: Observable<number> = interval(POLLING_INTERVAL_IN_MS).pipe(startWith(0));

const fetchData = (walletSigner: Nullable<JsonRpcSigner>) => {
  if (!walletSigner) {
    return of([]);
  }

  try {
    const dummyUnderlyingToken = SUPPORTED_UNDERLYING_TOKENS[0];

    const userPosition = new UserPosition(walletSigner, dummyUnderlyingToken);

    return from(userPosition.getTransactions()).pipe(
      catchError(error => {
        console.error('useManageTransactions - failed to fetch manage transactions', error);
        return of(null);
      }),
    );
  } catch (error) {
    console.error('useManageTransactions - failed to fetch manage transactions', error);
    return of(null);
  }
};

// Stream that fetches on wallet change
const walletChangeStream$ = walletSigner$.pipe(concatMap(walletSigner => fetchData(walletSigner)));

// Stream that fetches manage transactions periodically
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
    manageTransactions$.next(transactions);
  }),
);

export const [useManageTransactions] = bind(manageTransactions$, null);

let subscription: Subscription;

export const subscribeManageTransactions = (): void => {
  unsubscribeManageTransactions();
  subscription = stream$.subscribe();
};
export const unsubscribeManageTransactions = (): void => subscription?.unsubscribe();
export const resetManageTransactions = (): void => {
  manageTransactions$.next(null);
};
