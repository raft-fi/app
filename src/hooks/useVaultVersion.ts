import { bind } from '@react-rxjs/core';
import {
  of,
  merge,
  tap,
  filter,
  Observable,
  debounce,
  interval,
  Subscription,
  concatMap,
  BehaviorSubject,
  combineLatest,
} from 'rxjs';
import { VaultVersion } from '@raft-fi/sdk';
import { DEBOUNCE_IN_MS } from '../constants';
import { Nullable, Position } from '../interfaces';
import { position$ } from './usePosition';
import { wallet$ } from './useWallet';
import { BrowserProvider } from 'ethers';

const DEFAULT_VALUE = 'v2';

export const vaultVersion$ = new BehaviorSubject<Nullable<VaultVersion>>(DEFAULT_VALUE);

const fetchData = (position: Position, wallet: Nullable<BrowserProvider>): Observable<VaultVersion> => {
  // In case wallet is not connected, show v2 vaults UI
  if (!wallet) {
    return of('v2');
  }

  return of(position.vaultVersion);
};

// Stream that fetches savings max deposit every time provider changes
const providerStream$ = combineLatest([position$, wallet$]).pipe(
  filter((value): value is [Position, Nullable<BrowserProvider>] => {
    const [position] = value;

    return Boolean(position);
  }),
  concatMap<[Position, Nullable<BrowserProvider>], Observable<Nullable<VaultVersion>>>(([position, wallet]) =>
    fetchData(position, wallet),
  ),
);

// merge all stream$ into one if there are multiple
const stream$ = merge(providerStream$).pipe(
  filter((vaultVersion): vaultVersion is VaultVersion => Boolean(vaultVersion)),
  debounce<VaultVersion>(() => interval(DEBOUNCE_IN_MS)),
  tap(vaultVersion => {
    vaultVersion$.next(vaultVersion);
  }),
);

export const [useVaultVersion] = bind(vaultVersion$, null);

let subscription: Subscription;

export const subscribeVaultVersion = (): void => {
  unsubscribeVaultVersion();
  subscription = stream$.subscribe();
};
export const unsubscribeVaultVersion = (): void => subscription?.unsubscribe();
export const resetVaultVersion = (): void => {
  vaultVersion$.next(null);
};

subscribeVaultVersion();
