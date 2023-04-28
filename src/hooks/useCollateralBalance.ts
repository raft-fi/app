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
} from 'rxjs';
import Decimal from 'decimal';
import { JsonRpcSigner } from 'ethers';
import { RaftCollateralTokenService } from '../services';
import { DEBOUNCE_IN_MS } from '../constants';
import { Nullable } from '../interfaces';
import { walletSigner$ } from './useWalletSigner';

const collateralBalance$ = new BehaviorSubject<Nullable<Decimal>>(null);

// Stream that fetches collateral balance for currently connected wallet, this happens only when wallet address changes
const walletStream$ = walletSigner$.pipe(
  filter((walletSigner): walletSigner is JsonRpcSigner => Boolean(walletSigner)),
  concatMap<JsonRpcSigner, Observable<Nullable<Decimal>>>(walletSigner => {
    try {
      const raftCollateralCollateralService = new RaftCollateralTokenService(walletSigner);

      return from(raftCollateralCollateralService.balance()).pipe(
        catchError(error => {
          console.error(
            `useCollateralBalance - failed to fetch collateral balance for $wallet '${walletSigner.address}'`,
            error,
          );
          return of(null);
        }),
      );
    } catch (error) {
      console.error(
        `useCollateralBalance - failed to fetch collateral balance for $wallet '${walletSigner.address}'`,
        error,
      );
      return of(null);
    }
  }),
);

// merge all stream$ into one if there are multiple
const stream$ = merge(walletStream$).pipe(
  filter((balance): balance is Decimal => Boolean(balance)),
  debounce<Decimal>(() => interval(DEBOUNCE_IN_MS)),
  tap(balance => {
    collateralBalance$.next(balance);
  }),
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

subscribeCollateralBalances();
