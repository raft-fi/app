import { JsonRpcSigner, Signer } from 'ethers';
import { bind } from '@react-rxjs/core';
import {
  interval,
  BehaviorSubject,
  mergeMap,
  merge,
  debounce,
  tap,
  Subscription,
  withLatestFrom,
  filter,
  concatMap,
} from 'rxjs';
import { UserSavings } from '@raft-fi/sdk';
import { Decimal } from '@tempusfinance/decimal';
import { DEBOUNCE_IN_MS, SAVING_POSITION_BALANCE_THRESHOLD } from '../constants';
import { Nullable } from '../interfaces';
import { AppEvent, appEvent$ } from './useAppEvent';
import { walletSigner$ } from './useWalletSigner';

const DEFAULT_VALUE = null;

export const currentUserSavings$ = new BehaviorSubject<Nullable<Decimal>>(DEFAULT_VALUE);

const fetchData = async (signer: Signer) => {
  try {
    const savings = new UserSavings(signer);

    const currentSavings = await savings.currentSavings();

    if (currentSavings.abs().lt(SAVING_POSITION_BALANCE_THRESHOLD)) {
      return Decimal.ZERO;
    }

    return currentSavings;
  } catch (error) {
    console.error('useCurrentUserSavings (catch) - failed to fetch current user savings!', error);
    return DEFAULT_VALUE;
  }
};

// Fetch current user savings data every time wallet changes
const walletChangeStream$ = walletSigner$.pipe(
  concatMap(async signer => {
    if (!signer) {
      return DEFAULT_VALUE;
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
