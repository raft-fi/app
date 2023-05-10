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
import { JsonRpcProvider } from 'ethers';
import { RaftDebtTokenService } from '../services';
import { DEBOUNCE_IN_MS } from '../constants';
import { Nullable } from '../interfaces';
import { AppEvent, appEvent$ } from './useAppEvent';
import { walletAddress$ } from './useWalletAddress';
import { provider$ } from './useProvider';

const debtBalance$ = new BehaviorSubject<Nullable<Decimal>>(null);

const fetchData = (walletAddress: Nullable<string>, provider: JsonRpcProvider) => {
  // In case user disconnects the wallet we want to reset balance to null
  if (!walletAddress) {
    return of(null);
  }

  try {
    const raftDebtService = new RaftDebtTokenService(provider);

    return from(raftDebtService.balanceOf(walletAddress)).pipe(
      catchError(error => {
        console.error(`useDebtBalance - failed to fetch debt balance for $wallet '${walletAddress}'`, error);
        return of(null);
      }),
    );
  } catch (error) {
    console.error(`useDebtBalance - failed to fetch debt balance for $wallet '${walletAddress}'`, error);
    return of(null);
  }
};

// Stream that fetches debt balance for currently connected wallet, this happens only when wallet address changes
const walletStream$ = walletAddress$.pipe(
  withLatestFrom(provider$),
  concatMap<[Nullable<string>, JsonRpcProvider], Observable<Nullable<Decimal>>>(([walletAddress, provider]) =>
    fetchData(walletAddress, provider),
  ),
);

// fetch when app event fire
const appEventsStream$ = appEvent$.pipe(
  withLatestFrom(walletAddress$, provider$),
  filter((value): value is [AppEvent, string, JsonRpcProvider] => {
    const [, walletAddress] = value;

    return Boolean(walletAddress);
  }),
  concatMap(([, walletAddress, provider]) => fetchData(walletAddress, provider)),
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
