import { JsonRpcSigner } from 'ethers';
import { bind } from '@react-rxjs/core';
import { Bridge, BridgeRequestTransaction, SUPPORTED_BRIDGE_NETWORKS } from '@raft-fi/sdk';
import {
  from,
  merge,
  tap,
  filter,
  Observable,
  debounce,
  interval,
  Subscription,
  concatMap,
  BehaviorSubject,
  withLatestFrom,
} from 'rxjs';
import { DEBOUNCE_IN_MS, NETWORK_SUBGRAPH_URLS, POLLING_INTERVAL_IN_MS } from '../constants';
import { Nullable } from '../interfaces';
import { appEvent$ } from './useAppEvent';
import { walletSigner$ } from './useWalletSigner';

export const bridgeRequestTransactions$ = new BehaviorSubject<BridgeRequestTransaction[]>([]);

const intervalBeat$: Observable<number> = interval(POLLING_INTERVAL_IN_MS);

const fetchData = async (walletSigner: Nullable<JsonRpcSigner>) => {
  if (!walletSigner) {
    return [];
  }

  try {
    const bridge = new Bridge(walletSigner);

    const transactions = (
      await Promise.all(
        SUPPORTED_BRIDGE_NETWORKS.map(async network => {
          const networkSubgraphUrl = NETWORK_SUBGRAPH_URLS[network];
          if (!networkSubgraphUrl) {
            return [];
          }

          return await bridge.getBridgeTransactions(networkSubgraphUrl);
        }),
      )
    ).flat();

    return transactions;
  } catch (error) {
    console.error('useBridgeRequestTransactions - failed to fetch bridge request transactions', error);
    return [];
  }
};

// Stream that fetches on wallet change
const walletChangeStream$ = walletSigner$.pipe(concatMap(walletSigner => fetchData(walletSigner)));

// Stream that fetches transaction history periodically
const intervalStream$ = intervalBeat$.pipe(
  withLatestFrom(walletSigner$),
  concatMap<[number, Nullable<JsonRpcSigner>], Observable<BridgeRequestTransaction[]>>(([, walletSigner]) =>
    from(fetchData(walletSigner)),
  ),
);

// fetch when app event fire
const appEventsStream$ = appEvent$.pipe(
  withLatestFrom(walletSigner$),
  concatMap(([, walletSigner]) => fetchData(walletSigner)),
);

// merge all stream$ into one if there are multiple
const stream$ = merge(intervalStream$, appEventsStream$, walletChangeStream$).pipe(
  filter((transactions): transactions is BridgeRequestTransaction[] => Boolean(transactions)),
  debounce<BridgeRequestTransaction[]>(() => interval(DEBOUNCE_IN_MS)),
  tap(transactions => {
    bridgeRequestTransactions$.next(transactions);
  }),
);

export const [useBridgeRequestTransactions] = bind(bridgeRequestTransactions$, null);

let subscription: Subscription;

export const subscribeBridgeRequestTransactions = (): void => {
  unsubscribeBridgeRequestTransactions();
  subscription = stream$.subscribe();
};
export const unsubscribeBridgeRequestTransactions = (): void => subscription?.unsubscribe();
export const resetBridgeRequestTransactions = (): void => {
  bridgeRequestTransactions$.next([]);
};

subscribeBridgeRequestTransactions();
