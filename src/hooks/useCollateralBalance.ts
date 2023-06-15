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

export const collateralBalance$ = new BehaviorSubject<Nullable<Decimal>>(null);

const fetchData = (signer: JsonRpcSigner | null) => {
  if (!signer) {
    return of(null);
  }

  try {
    const userPosition = new UserPosition(signer);

    return from(userPosition.fetchCollateral()).pipe(
      catchError(error => {
        console.error('useCollateralBalance - failed to fetch collateral balance!', error);
        return of(null);
      }),
    );
  } catch (error) {
    console.error('useCollateralBalance - failed to fetch collateral balance!', error);
    return of(null);
  }
};

// Stream that fetches collateral balance for currently connected wallet, this happens only when wallet address changes
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
  tap(balance => collateralBalance$.next(balance)),
);

export const [useCollateralBalance] = bind(collateralBalance$, null);

let subscription: Subscription;

export const subscribeCollateralBalances = (): void => {
  unsubscribeCollateralBalances();
  subscription = stream$.subscribe();
};
export const unsubscribeCollateralBalances = (): void => subscription?.unsubscribe();
export const resetCollateralBalances = (): void => {
  collateralBalance$.next(null);
};
