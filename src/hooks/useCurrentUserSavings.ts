import { JsonRpcSigner, Signer } from 'ethers';
import { bind } from '@react-rxjs/core';
import {
  interval,
  BehaviorSubject,
  mergeMap,
  map,
  from,
  merge,
  debounce,
  tap,
  Subscription,
  withLatestFrom,
  filter,
  of,
  catchError,
  concatMap,
} from 'rxjs';
import { UserSavings } from '@raft-fi/sdk';
import { Decimal } from '@tempusfinance/decimal';
import { DEBOUNCE_IN_MS } from '../constants';
import { Nullable } from '../interfaces';
import { AppEvent, appEvent$ } from './useAppEvent';
import { walletSigner$ } from './useWalletSigner';

const DEFAULT_VALUE = null;

export const currentUserSavings$ = new BehaviorSubject<Nullable<Decimal>>(DEFAULT_VALUE);

const fetchData = (signer: Signer) => {
  try {
    const savings = new UserSavings(signer);

    return from(savings.currentSavings()).pipe(
      map(currentUserSavings => {
        return currentUserSavings;
      }),
      catchError(error => {
        console.error('useCurrentUserSavings (catchError) - failed to fetch current user savings!', error);
        return of(null);
      }),
    );
  } catch (error) {
    console.error('useCurrentUserSavings (catch) - failed to fetch current user savings!', error);
    return of(null);
  }
};

// Fetch current user savings data every time wallet changes
const walletChangeStream$ = walletSigner$.pipe(
  concatMap(signer => {
    if (!signer) {
      return of(DEFAULT_VALUE);
    }

    return fetchData(signer);
  }),
);

// fetch when app event fire
const appEventsStream$ = appEvent$.pipe(
  withLatestFrom(walletSigner$),
  filter((value): value is [AppEvent, JsonRpcSigner] => {
    const [, signer] = value;

    return Boolean(signer);
  }),
  mergeMap(([, signer]) => {
    return fetchData(signer);
  }),
);

// merge all stream$ into one, use merge() for multiple
const stream$ = merge(walletChangeStream$, appEventsStream$).pipe(
  debounce(() => interval(DEBOUNCE_IN_MS)),
  tap(currentUserSavings => currentUserSavings$.next(currentUserSavings)),
);

export const [useCurrentUserSavings] = bind(currentUserSavings$, DEFAULT_VALUE);

let subscription: Subscription;

export const subscribeCurrentUserSavings = (): void => {
  unsubscribeCurrentUserSavings();
  subscription = stream$.subscribe();
};
export const unsubscribeCurrentUserSavings = (): void => subscription?.unsubscribe();
export const resetCurrentUserSavings = (): void => currentUserSavings$.next(DEFAULT_VALUE);
