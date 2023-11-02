import { JsonRpcProvider } from 'ethers';
import { bind } from '@react-rxjs/core';
import {
  interval,
  BehaviorSubject,
  Observable,
  mergeMap,
  merge,
  scan,
  debounce,
  tap,
  Subscription,
  startWith,
} from 'rxjs';
import { Savings, SupportedSavingsNetwork } from '@raft-fi/sdk';
import { Decimal } from '@tempusfinance/decimal';
import { DEBOUNCE_IN_MS, NETWORK_RPC_URLS, POLLING_INTERVAL_IN_MS } from '../constants';
import { Nullable } from '../interfaces';
import { SAVINGS_MAINNET_NETWORKS, SAVINGS_TESTNET_NETWORKS } from '../networks';
import { appEvent$ } from './useAppEvent';

export type SavingsYieldReserveMap = { [network in SupportedSavingsNetwork]: Decimal | null };

const DEFAULT_VALUE: SavingsYieldReserveMap = {
  mainnet: null,
  base: null,
  goerli: null,
};

const intervalBeat$: Observable<number> = interval(POLLING_INTERVAL_IN_MS).pipe(startWith(0));

export const savingsYieldReserves$ = new BehaviorSubject<SavingsYieldReserveMap>(DEFAULT_VALUE);

const fetchData = async (network: SupportedSavingsNetwork): Promise<Nullable<Decimal>> => {
  try {
    const networkRpc = NETWORK_RPC_URLS[network];

    const provider = new JsonRpcProvider(networkRpc, 'any');
    const savings = new Savings(provider, network);
    const result = await savings.getYieldReserve();

    return result;
  } catch (error) {
    console.error(`useSavingsYieldReserves - Failed to get savings yield reserves for ${network}`, error);
    return null;
  }
};

// Fetch data periodically
const intervalStream$ = intervalBeat$.pipe(
  mergeMap(async () => {
    let networks: SupportedSavingsNetwork[] = [];
    if (import.meta.env.VITE_ENVIRONMENT === 'mainnet') {
      networks = SAVINGS_MAINNET_NETWORKS;
    } else {
      networks = SAVINGS_TESTNET_NETWORKS;
    }

    const savingsYieldReservesMap = DEFAULT_VALUE;

    // TODO: fetch data in sync for now
    for (const network of networks) {
      const yieldReserve = await fetchData(network);
      savingsYieldReservesMap[network] = yieldReserve;
    }

    return savingsYieldReservesMap;
  }),
);

// fetch when app event fire
const appEventsStream$ = appEvent$.pipe(
  mergeMap(async () => {
    let networks: SupportedSavingsNetwork[] = [];
    if (import.meta.env.VITE_ENVIRONMENT === 'mainnet') {
      networks = SAVINGS_MAINNET_NETWORKS;
    } else {
      networks = SAVINGS_TESTNET_NETWORKS;
    }

    const savingsYieldReservesMap = DEFAULT_VALUE;

    // TODO: fetch data in sync for now
    for (const network of networks) {
      const yieldReserve = await fetchData(network);
      savingsYieldReservesMap[network] = yieldReserve;
    }

    return savingsYieldReservesMap;
  }),
);

// merge all streams into one
const stream$ = merge(intervalStream$, appEventsStream$).pipe(
  scan(
    (allSavingsYieldReservess, savingsYieldReservess) => ({
      ...allSavingsYieldReservess,
      ...savingsYieldReservess,
    }),
    {} as SavingsYieldReserveMap,
  ),
  debounce<SavingsYieldReserveMap>(() => interval(DEBOUNCE_IN_MS)),
  tap(allSavingsYieldReservess => savingsYieldReserves$.next(allSavingsYieldReservess)),
);

export const [useSavingsYieldReserves] = bind(savingsYieldReserves$, DEFAULT_VALUE);

let subscription: Subscription;

export const subscribeSavingsYieldReserves = (): void => {
  unsubscribeSavingsYieldReserves();
  subscription = stream$.subscribe();
};
export const unsubscribeSavingsYieldReserves = (): void => subscription?.unsubscribe();
export const resetSavingsYieldReserves = (): void => savingsYieldReserves$.next(DEFAULT_VALUE);

subscribeSavingsYieldReserves();
