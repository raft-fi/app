import { bind } from '@react-rxjs/core';
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
import { Decimal } from '@tempusfinance/decimal';
import { JsonRpcSigner } from 'ethers';
import { DEBOUNCE_IN_MS } from '../constants';
import { Nullable } from '../interfaces';
import { AppEvent, appEvent$ } from './useAppEvent';
import { UserPosition } from '@raft-fi/sdk';
import { walletSigner$ } from './useWalletSigner';

export const debtBalance$ = new BehaviorSubject<Nullable<Decimal>>(null);

const fetchData = (walletSigner: JsonRpcSigner | null) => {
  // In case user disconnects the wallet we want to reset balance to null
  if (!walletSigner) {
    return of(null);
  }

  try {
    const userPosition = new UserPosition(walletSigner);

    return from(userPosition.fetchDebt()).pipe(
      catchError(error => {
        console.error(`useDebtBalance - failed to fetch debt balance!`, error);
        return of(null);
      }),
    );
  } catch (error) {
    console.error(`useDebtBalance - failed to fetch debt balance!`, error);
    return of(null);
  }
};

// Stream that fetches debt balance for currently connected wallet, this happens only when wallet address changes
const walletStream$ = walletSigner$.pipe(
  concatMap<JsonRpcSigner | null, Observable<Nullable<Decimal>>>(signer => fetchData(signer)),
);

// fetch when app event fire
const appEventsStream$ = appEvent$.pipe(
  withLatestFrom(walletSigner$),
  filter((value): value is [AppEvent, JsonRpcSigner] => {
    const [, signer] = value;

    return Boolean(signer);
  }),
  concatMap(([, signer]) => fetchData(signer)),
);

// merge all stream$ into one if there are multiple
const stream$ = merge(walletStream$, appEventsStream$).pipe(
  debounce<Nullable<Decimal>>(() => interval(DEBOUNCE_IN_MS)),
  tap(balance => {
    debtBalance$.next(balance);
  }),
);

export const [useDebtBalance] = bind(debtBalance$, null);

let subscription: Subscription;

export const subscribeDebtBalances = (): void => {
  unsubscribeDebtBalances();
  subscription = stream$.subscribe();
};
export const unsubscribeDebtBalances = (): void => subscription?.unsubscribe();
export const resetDebtBalances = (): void => {
  debtBalance$.next(null);
};
