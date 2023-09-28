import { JsonRpcProvider } from 'ethers';
import { bind } from '@react-rxjs/core';
import { RaftConfig, Savings, SupportedSavingsNetwork } from '@raft-fi/sdk';
import { Decimal } from '@tempusfinance/decimal';
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
import { DEBOUNCE_IN_MS, NETWORK_RPC_URLS, POLLING_INTERVAL_IN_MS } from '../constants';
import { Nullable } from '../interfaces';
import { currentSavingsNetwork$ } from './useCurrentSavingsNetwork';

export const savingsYield$ = new BehaviorSubject<Nullable<Decimal>>(null);

const intervalBeat$: Observable<number> = interval(POLLING_INTERVAL_IN_MS);

const fetchData = (network: SupportedSavingsNetwork) => {
  try {
    const networkRpc = NETWORK_RPC_URLS[network];

    const provider = new JsonRpcProvider(networkRpc, 'any');
    // TODO - This is a workaround to create savings instance for specific network - if we change network in RaftConfig globally
    // and leave it like that some other parts of app will break. We need to refactor the app to correctly handle all possible networks
    const cachedNetwork = RaftConfig.network;
    RaftConfig.setNetwork(network);
    const savings = new Savings(provider);
    RaftConfig.setNetwork(cachedNetwork);

    return from(savings.getCurrentYield()).pipe(
      catchError(error => {
        console.error('useSavingsYield (catchError) - failed to fetch savings yield value!', error);
        return of(null);
      }),
    );
  } catch (error) {
    console.error('useSavingsYield (catch) - failed to fetch savings yield value!', error);
    return of(null);
  }
};

// Fetch data every time user changes network in UI
const savingsNetworkChangeStream$ = currentSavingsNetwork$.pipe(
  concatMap(currentSavingsNetwork => {
    return fetchData(currentSavingsNetwork);
  }),
);

// Fetch data periodically
const intervalStream$ = intervalBeat$.pipe(
  withLatestFrom(currentSavingsNetwork$),
  concatMap<[number, SupportedSavingsNetwork], Observable<Nullable<Decimal>>>(([, currentSavingsNetwork]) =>
    fetchData(currentSavingsNetwork),
  ),
);

// merge all stream$ into one if there are multiple
const stream$ = merge(savingsNetworkChangeStream$, intervalStream$).pipe(
  filter((savingsYield): savingsYield is Decimal => Boolean(savingsYield)),
  debounce<Decimal>(() => interval(DEBOUNCE_IN_MS)),
  tap(savingsYield => {
    savingsYield$.next(savingsYield);
  }),
);

export const [useSavingsYield] = bind(savingsYield$, null);

let subscription: Subscription;

export const subscribeSavingsYield = (): void => {
  unsubscribeSavingsYield();
  subscription = stream$.subscribe();
};
export const unsubscribeSavingsYield = (): void => subscription?.unsubscribe();
export const resetSavingsYield = (): void => {
  savingsYield$.next(null);
};
