import { JsonRpcProvider } from 'ethers';
import { bind } from '@react-rxjs/core';
import { Savings, SupportedSavingsNetwork } from '@raft-fi/sdk';
import { Decimal } from '@tempusfinance/decimal';
import {
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
import { DEBOUNCE_IN_MS, NETWORK_RPC_URLS, POLLING_INTERVAL_IN_MS } from '../constants';
import { Nullable } from '../interfaces';
import { currentSavingsNetwork$ } from './useCurrentSavingsNetwork';

export const savingsYield$ = new BehaviorSubject<Nullable<Decimal>>(null);

const intervalBeat$: Observable<number> = interval(POLLING_INTERVAL_IN_MS);

const fetchData = async (network: SupportedSavingsNetwork) => {
  try {
    const networkRpc = NETWORK_RPC_URLS[network];

    const provider = new JsonRpcProvider(networkRpc, 'any');
    const savings = new Savings(provider, network);

    return await savings.getCurrentYield();
  } catch (error) {
    console.error('useSavingsYield (catch) - failed to fetch savings yield value!', error);
    return null;
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
  concatMap<[number, SupportedSavingsNetwork], Promise<Nullable<Decimal>>>(([, currentSavingsNetwork]) =>
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
