import { JsonRpcSigner } from 'ethers';
import { bind } from '@react-rxjs/core';
import {
  interval,
  BehaviorSubject,
  Observable,
  mergeMap,
  map,
  from,
  merge,
  scan,
  debounce,
  tap,
  Subscription,
  withLatestFrom,
  filter,
  of,
} from 'rxjs';
import { Bridge, SUPPORTED_BRIDGE_NETWORKS, SupportedBridgeNetwork } from '@raft-fi/sdk';
import { Decimal } from '@tempusfinance/decimal';
import { DEBOUNCE_IN_MS, NETWORK_RPC_URLS } from '../constants';
import { Nullable } from '../interfaces';
import { AppEvent, appEvent$ } from './useAppEvent';
import { walletSigner$ } from './useWalletSigner';

export type BridgeBalanceMap = { [network in SupportedBridgeNetwork]: Decimal | null };

const DEFAULT_VALUE: BridgeBalanceMap = {
  ethereum: null,
  base: null,
  ethereumSepolia: null,
  arbitrumGoerli: null,
};

export const bridgeBalances$ = new BehaviorSubject<BridgeBalanceMap>(DEFAULT_VALUE);

const fetchData = async (
  network: SupportedBridgeNetwork,
  walletSigner: JsonRpcSigner,
  networkRpc: string,
): Promise<Nullable<Decimal>> => {
  try {
    const bridge = new Bridge(walletSigner);

    const result = await bridge.fetchBalance(network, networkRpc);

    return result;
  } catch (error) {
    console.error(`useBridgeBalance - Failed to get bridge balance for ${network}`, error);
    return null;
  }
};

// Fetch new balance data every time wallet address changes
const walletChangeStream$: Observable<BridgeBalanceMap> = walletSigner$.pipe(
  mergeMap<Nullable<JsonRpcSigner>, Observable<BridgeBalanceMap>>(walletSigner => {
    if (!walletSigner) {
      return of(DEFAULT_VALUE);
    }

    const bridgeBalanceMaps: Observable<BridgeBalanceMap>[] = SUPPORTED_BRIDGE_NETWORKS.map(network => {
      const networkRpc = NETWORK_RPC_URLS[network];

      return from(fetchData(network, walletSigner, networkRpc)).pipe(
        map(balance => ({ [network]: balance } as BridgeBalanceMap)),
      );
    });

    return merge(...bridgeBalanceMaps);
  }),
);

// fetch when app event fire
const appEventsStream$ = appEvent$.pipe(
  withLatestFrom(walletSigner$),
  filter((value): value is [AppEvent, JsonRpcSigner] => {
    const [, walletSigner] = value;

    return Boolean(walletSigner);
  }),
  mergeMap(([, walletSigner]) => {
    const bridgeBalanceMaps = SUPPORTED_BRIDGE_NETWORKS.map(network => {
      const networkRpc = NETWORK_RPC_URLS[network];

      return from(fetchData(network, walletSigner, networkRpc)).pipe(
        map(balance => ({ [network]: balance } as BridgeBalanceMap)),
      );
    });

    return merge(...bridgeBalanceMaps);
  }),
);

// merge all stream$ into one, use merge() for multiple
const stream$ = merge(walletChangeStream$, appEventsStream$).pipe(
  scan(
    (allBalances, bridgeBalances) => ({
      ...allBalances,
      ...bridgeBalances,
    }),
    {} as BridgeBalanceMap,
  ),
  debounce<BridgeBalanceMap>(() => interval(DEBOUNCE_IN_MS)),
  tap(allBalances => bridgeBalances$.next(allBalances)),
);

export const [useBridgeBalances] = bind(bridgeBalances$, DEFAULT_VALUE);

let subscription: Subscription;

export const subscribeBridgeBalances = (): void => {
  unsubscribeBridgeBalances();
  subscription = stream$.subscribe();
};
export const unsubscribeBridgeBalances = (): void => subscription?.unsubscribe();
export const resetBridgeBalances = (): void => bridgeBalances$.next(DEFAULT_VALUE);

subscribeBridgeBalances();
