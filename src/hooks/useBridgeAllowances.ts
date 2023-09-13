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

export type BridgeAllowanceMap = { [network in SupportedBridgeNetwork]: Nullable<Decimal> };

const DEFAULT_VALUE: BridgeAllowanceMap = {
  ethereum: null,
  base: null,
  ethereumSepolia: null,
  arbitrumGoerli: null,
};

export const bridgeAllowances$ = new BehaviorSubject<BridgeAllowanceMap>(DEFAULT_VALUE);

const fetchData = async (
  network: SupportedBridgeNetwork,
  walletSigner: JsonRpcSigner,
  networkRpc: string,
): Promise<Nullable<Decimal>> => {
  try {
    const bridge = new Bridge(walletSigner);

    const result = await bridge.fetchAllowance(network, networkRpc);

    return result;
  } catch (error) {
    console.error(`useBridgeAllowance - Failed to get bridge allowance for ${network}`, error);
    return null;
  }
};

// Fetch new allowance data every time wallet address changes
const walletChangeStream$: Observable<BridgeAllowanceMap> = walletSigner$.pipe(
  mergeMap<Nullable<JsonRpcSigner>, Observable<BridgeAllowanceMap>>(walletSigner => {
    if (!walletSigner) {
      return of(DEFAULT_VALUE);
    }

    const bridgeAllowanceMaps: Observable<BridgeAllowanceMap>[] = SUPPORTED_BRIDGE_NETWORKS.map(network => {
      const networkRpc = NETWORK_RPC_URLS[network];

      return from(fetchData(network, walletSigner, networkRpc)).pipe(
        map(allowance => ({ [network]: allowance } as BridgeAllowanceMap)),
      );
    });

    return merge(...bridgeAllowanceMaps);
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
    const bridgeAllowanceMaps = SUPPORTED_BRIDGE_NETWORKS.map(network => {
      const networkRpc = NETWORK_RPC_URLS[network];

      return from(fetchData(network, walletSigner, networkRpc)).pipe(
        map(allowance => ({ [network]: allowance } as BridgeAllowanceMap)),
      );
    });

    return merge(...bridgeAllowanceMaps);
  }),
);

// merge all stream$ into one, use merge() for multiple
const stream$ = merge(walletChangeStream$, appEventsStream$).pipe(
  scan(
    (allAllowances, bridgeAllowances) => ({
      ...allAllowances,
      ...bridgeAllowances,
    }),
    {} as BridgeAllowanceMap,
  ),
  debounce<BridgeAllowanceMap>(() => interval(DEBOUNCE_IN_MS)),
  tap(allAllowances => bridgeAllowances$.next(allAllowances)),
);

export const [useBridgeAllowances] = bind(bridgeAllowances$, DEFAULT_VALUE);

let subscription: Subscription;

export const subscribeBridgeAllowances = (): void => {
  unsubscribeBridgeAllowances();
  subscription = stream$.subscribe();
};
export const unsubscribeBridgeAllowances = (): void => subscription?.unsubscribe();
export const resetBridgeAllowances = (): void => bridgeAllowances$.next(DEFAULT_VALUE);

subscribeBridgeAllowances();
