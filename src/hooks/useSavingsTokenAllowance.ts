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
import { SupportedSavingsNetwork, UserSavings } from '@raft-fi/sdk';
import { Decimal } from '@tempusfinance/decimal';
import { DEBOUNCE_IN_MS } from '../constants';
import { Nullable } from '../interfaces';
import { AppEvent, appEvent$ } from './useAppEvent';
import { walletSigner$ } from './useWalletSigner';
import { currentSavingsNetwork$ } from './useCurrentSavingsNetwork';
import { isWrongSavingsNetwork$ } from './useNetwork';

const DEFAULT_VALUE = null;

/**
 * Contains user R token allowance (RR token is spender) for currently selected savings network
 */
export const savingsTokenAllowance$ = new BehaviorSubject<Nullable<Decimal>>(DEFAULT_VALUE);

const fetchData = async (signer: Signer, network: SupportedSavingsNetwork) => {
  try {
    const savings = new UserSavings(signer, network);

    return savings.fetchAllowance();
  } catch (error) {
    console.error('useCurrentUserSavings (catch) - failed to fetch current user savings!', error);
    return DEFAULT_VALUE;
  }
};

// Fetch current user savings data every time user changes network in UI
const savingsNetworkChangeStream$ = currentSavingsNetwork$.pipe(
  withLatestFrom(walletSigner$, isWrongSavingsNetwork$),
  concatMap(async ([currentSavingsNetwork, signer, isWrongSavingsNetwork]) => {
    if (!signer || isWrongSavingsNetwork) {
      return DEFAULT_VALUE;
    }

    return fetchData(signer, currentSavingsNetwork);
  }),
);

// Fetch current user savings data every time wallet changes
const walletChangeStream$ = walletSigner$.pipe(
  withLatestFrom(currentSavingsNetwork$, isWrongSavingsNetwork$),
  concatMap(async ([signer, currentSavingsNetwork, isWrongSavingsNetwork]) => {
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
    const [, signer, , isWrongSavingsNetwork] = value;

    return Boolean(signer) && !isWrongSavingsNetwork;
  }),
  mergeMap(([, signer, currentSavingsNetwork]) => {
    return fetchData(signer, currentSavingsNetwork);
  }),
);

// merge all stream$ into one, use merge() for multiple
const stream$ = merge(walletChangeStream$, appEventsStream$, savingsNetworkChangeStream$).pipe(
  debounce(() => interval(DEBOUNCE_IN_MS)),
  tap(currentUserSavings => savingsTokenAllowance$.next(currentUserSavings)),
);

export const [useSavingsTokenAllowance] = bind(savingsTokenAllowance$, DEFAULT_VALUE);

let subscription: Subscription;

export const subscribeSavingsTokenAllowance = (): void => {
  unsubscribeSavingsTokenAllowance();
  subscription = stream$.subscribe();
};
export const unsubscribeSavingsTokenAllowance = (): void => subscription?.unsubscribe();
export const resetSavingsTokenAllowance = (): void => savingsTokenAllowance$.next(DEFAULT_VALUE);

subscribeSavingsTokenAllowance();
