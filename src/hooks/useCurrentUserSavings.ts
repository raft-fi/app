import { JsonRpcSigner, Signer } from 'ethers';
import { bind } from '@react-rxjs/core';
import {
  interval,
  BehaviorSubject,
  merge,
  debounce,
  tap,
  Subscription,
  withLatestFrom,
  filter,
  concatMap,
  combineLatest,
} from 'rxjs';
import { SupportedSavingsNetwork, UserSavings } from '@raft-fi/sdk';
import { Decimal } from '@tempusfinance/decimal';
import { DEBOUNCE_IN_MS, SAVING_POSITION_BALANCE_THRESHOLD } from '../constants';
import { Nullable } from '../interfaces';
import { AppEvent, appEvent$ } from './useAppEvent';
import { walletSigner$ } from './useWalletSigner';
import { currentSavingsNetwork$ } from './useCurrentSavingsNetwork';
import { isWrongSavingsNetwork$ } from './useNetwork';

const DEFAULT_VALUE = null;

export const currentUserSavings$ = new BehaviorSubject<Nullable<Decimal>>(DEFAULT_VALUE);

const fetchData = async (signer: Signer, network: SupportedSavingsNetwork) => {
  try {
    const savings = new UserSavings(signer, network);

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

// Fetch current user savings data every time wallet/network changes
const changeStream$ = combineLatest([walletSigner$, currentSavingsNetwork$]).pipe(
  withLatestFrom(isWrongSavingsNetwork$),
  concatMap(async ([[signer, currentSavingsNetwork], isWrongSavingsNetwork]) => {
    if (!signer || isWrongSavingsNetwork) {
      return DEFAULT_VALUE;
    }

    return fetchData(signer, currentSavingsNetwork);
  }),
);

// fetch when app event fire
const appEventsStream$ = appEvent$.pipe(
  withLatestFrom(walletSigner$, currentSavingsNetwork$, isWrongSavingsNetwork$),
  filter((value): value is [AppEvent, JsonRpcSigner, SupportedSavingsNetwork, boolean] => {
    const [appEvent, signer, , isWrongSavingsNetwork] = value;

    return appEvent?.eventType === 'manageSavings' && Boolean(signer) && !isWrongSavingsNetwork;
  }),
  concatMap(([, signer, currentSavingsNetwork]) => {
    return fetchData(signer, currentSavingsNetwork);
  }),
);

// merge all stream$ into one, use merge() for multiple
const stream$ = merge(changeStream$, appEventsStream$).pipe(
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
