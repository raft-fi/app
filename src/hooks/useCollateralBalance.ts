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
import { Decimal } from 'tempus-decimal';
import { JsonRpcProvider } from 'ethers';
import { RaftCollateralTokenService } from '../services';
import { DEBOUNCE_IN_MS } from '../constants';
import { Nullable } from '../interfaces';
import { AppEvent, appEvent$ } from './useAppEvent';
import { walletAddress$ } from './useWalletAddress';
import { provider$ } from './useProvider';

const collateralBalance$ = new BehaviorSubject<Nullable<Decimal>>(null);

const fetchData = (walletAddress: string, provider: JsonRpcProvider) => {
  try {
    const raftCollateralCollateralService = new RaftCollateralTokenService(provider);

    return from(raftCollateralCollateralService.balanceOf(walletAddress)).pipe(
      catchError(error => {
        console.error(
          `useCollateralBalance - failed to fetch collateral balance for $wallet '${walletAddress}'`,
          error,
        );
        return of(null);
      }),
    );
  } catch (error) {
    console.error(`useCollateralBalance - failed to fetch collateral balance for $wallet '${walletAddress}'`, error);
    return of(null);
  }
};

// Stream that fetches collateral balance for currently connected wallet, this happens only when wallet address changes
const walletStream$ = walletAddress$.pipe(
  withLatestFrom(provider$),
  filter((value): value is [string, JsonRpcProvider] => {
    const [wallet] = value;

    return Boolean(wallet);
  }),
  concatMap<[string, JsonRpcProvider], Observable<Nullable<Decimal>>>(([walletAddress, provider]) =>
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
