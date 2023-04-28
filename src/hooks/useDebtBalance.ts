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
import { RaftDebtTokenService } from '../services';
import { DEBOUNCE_IN_MS } from '../constants';
import { Nullable } from '../interfaces';
import { walletSigner$ } from './useWalletSigner';

const debtBalance$ = new BehaviorSubject<Nullable<Decimal>>(null);

// Stream that fetches debt balance for currently connected wallet, this happens only when wallet address changes
const walletStream$ = walletSigner$.pipe(
  filter((walletSigner): walletSigner is JsonRpcSigner => Boolean(walletSigner)),
  concatMap<JsonRpcSigner, Observable<Decimal | null>>(walletSigner => {
    try {
      const raftSDebtTokenService = new RaftDebtTokenService(walletSigner);

      return from(raftSDebtTokenService.balance()).pipe(
        catchError(error => {
          console.error(`useDebtBalance - failed to fetch debt balance for $wallet '${walletSigner.address}'`, error);
          return of(null);
        }),
      );
    } catch (error) {
      console.error(`useDebtBalance - failed to fetch debt balance for $wallet '${walletSigner.address}'`, error);
      return of(null);
    }
  }),
);

// merge all stream$ into one if there are multiple
const stream$ = merge(walletStream$).pipe(
  filter((balance): balance is Decimal => Boolean(balance)),
  debounce<Decimal>(() => interval(DEBOUNCE_IN_MS)),
  tap(balance => {
    debtBalance$.next(balance);
  }),
);

export const [useDebtBalance] = bind(debtBalance$, null);

let subscription: Subscription;

export const subscribeDebtBalance = (): void => {
  unsubscribeDebtBalance();
  subscription = stream$.subscribe();
};
export const unsubscribeDebtBalance = (): void => subscription?.unsubscribe();
export const resetDebtBalance = (): void => {
  debtBalance$.next(null);
};

subscribeDebtBalance();
