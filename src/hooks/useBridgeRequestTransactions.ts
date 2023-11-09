import { JsonRpcSigner } from 'ethers';
import { Bridge, BridgeRequestTransaction, SUPPORTED_BRIDGE_NETWORKS } from '@raft-fi/sdk';
import { merge, tap, filter, concatMap, distinctUntilChanged, BehaviorSubject } from 'rxjs';
import { NETWORK_SUBGRAPH_URLS } from '../constants';
import { Nullable } from '../interfaces';
import { walletSigner$ } from './useWalletSigner';

const rawBridgeRequestTransactions$ = new BehaviorSubject<BridgeRequestTransaction[]>([]);

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

// merge all stream$ into one if there are multiple
const stream$ = merge(walletChangeStream$).pipe(
  filter((transactions): transactions is BridgeRequestTransaction[] => Boolean(transactions)),
  tap(transactions => rawBridgeRequestTransactions$.next(transactions)),
);

// serve last cached data, and meanwhile request to fetch new
export const bridgeRequestTransactions$ = merge(rawBridgeRequestTransactions$, stream$).pipe(
  distinctUntilChanged((prev, curr) => prev[0]?.id === curr[0]?.id),
);
