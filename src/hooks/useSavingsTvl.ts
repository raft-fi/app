import { JsonRpcProvider } from 'ethers';
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
  startWith,
} from 'rxjs';
import { Savings, SupportedSavingsNetwork } from '@raft-fi/sdk';
import { Decimal } from '@tempusfinance/decimal';
import { DEBOUNCE_IN_MS, NETWORK_RPC_URLS, POLLING_INTERVAL_IN_MS } from '../constants';
import { Nullable } from '../interfaces';
import { SAVINGS_MAINNET_NETWORKS, SAVINGS_TESTNET_NETWORKS } from '../networks';
import { appEvent$ } from './useAppEvent';

export type SavingsTvlMap = { [network in SupportedSavingsNetwork]: Decimal | null };

const DEFAULT_VALUE: SavingsTvlMap = {
  mainnet: null,
  base: null,
  goerli: null,
};

const intervalBeat$: Observable<number> = interval(POLLING_INTERVAL_IN_MS).pipe(startWith(0));

export const savingsTvl$ = new BehaviorSubject<SavingsTvlMap>(DEFAULT_VALUE);

const fetchData = async (network: SupportedSavingsNetwork): Promise<Nullable<Decimal>> => {
  try {
    const networkRpc = NETWORK_RPC_URLS[network];

    const provider = new JsonRpcProvider(networkRpc, 'any');
    const savings = new Savings(provider, network);
    const result = await savings.getTvl();

    return result;
  } catch (error) {
    console.error(`useSavingsTvl - Failed to get savings tvl for ${network}`, error);
    return null;
  }
};

// Fetch data periodically
const intervalStream$ = intervalBeat$.pipe(
  mergeMap(() => {
    let networks: SupportedSavingsNetwork[] = [];
    if (import.meta.env.VITE_ENVIRONMENT === 'mainnet') {
      networks = SAVINGS_MAINNET_NETWORKS;
    } else {
      networks = SAVINGS_TESTNET_NETWORKS;
    }

    const savingsTvlMaps = networks.map(network => {
      return from(fetchData(network)).pipe(map(balance => ({ [network]: balance } as SavingsTvlMap)));
    });

    return merge(...savingsTvlMaps);
  }),
);

// fetch when app event fire
const appEventsStream$ = appEvent$.pipe(
  mergeMap(() => {
    let networks: SupportedSavingsNetwork[] = [];
    if (import.meta.env.VITE_ENVIRONMENT === 'mainnet') {
      networks = SAVINGS_MAINNET_NETWORKS;
    } else {
      networks = SAVINGS_TESTNET_NETWORKS;
    }

    const savingsTvlMaps = networks.map(network => {
      return from(fetchData(network)).pipe(map(balance => ({ [network]: balance } as SavingsTvlMap)));
    });

    return merge(...savingsTvlMaps);
  }),
);

// merge all streams into one
const stream$ = merge(intervalStream$, appEventsStream$).pipe(
  scan(
    (allSavingsTvls, savingsTvls) => ({
      ...allSavingsTvls,
      ...savingsTvls,
    }),
    {} as SavingsTvlMap,
  ),
  debounce<SavingsTvlMap>(() => interval(DEBOUNCE_IN_MS)),
  tap(allSavingsTvls => savingsTvl$.next(allSavingsTvls)),
);

export const [useSavingsTvl] = bind(savingsTvl$, DEFAULT_VALUE);

let subscription: Subscription;

export const subscribeSavingsTvl = (): void => {
  unsubscribeSavingsTvl();
  subscription = stream$.subscribe();
};
export const unsubscribeSavingsTvl = (): void => subscription?.unsubscribe();
export const resetSavingsTvl = (): void => savingsTvl$.next(DEFAULT_VALUE);

subscribeSavingsTvl();
