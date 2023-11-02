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
import { SUPPORTED_SAVINGS_NETWORKS } from '../networks';
import { appEvent$ } from './useAppEvent';

export type SavingsStat = {
  currentYield: Nullable<Decimal>;
  tvl: Nullable<Decimal>;
  yieldReserve: Nullable<Decimal>;
};

export type SavingsStatMap = { [network in SupportedSavingsNetwork]: SavingsStat };

const DEFAULT_STAT: SavingsStat = {
  currentYield: null,
  tvl: null,
  yieldReserve: null,
};
const DEFAULT_VALUE: SavingsStatMap = {
  mainnet: DEFAULT_STAT,
  base: DEFAULT_STAT,
  goerli: DEFAULT_STAT,
};

const intervalBeat$: Observable<number> = interval(POLLING_INTERVAL_IN_MS).pipe(startWith(0));

export const savingsStats$ = new BehaviorSubject<SavingsStatMap>(DEFAULT_VALUE);

const fetchData = async (network: SupportedSavingsNetwork): Promise<SavingsStat> => {
  try {
    const networkRpc = NETWORK_RPC_URLS[network];

    const provider = new JsonRpcProvider(networkRpc, 'any');
    const savings = new Savings(provider, network);
    const [currentYield, tvl, yieldReserve] = await Promise.all([
      savings.getCurrentYield(),
      savings.getTvl(),
      savings.getYieldReserve(),
    ]);

    return {
      currentYield,
      tvl,
      yieldReserve,
    };
  } catch (error) {
    console.error(`useSavingsStats - Failed to get savings tvl for ${network}`, error);
    return DEFAULT_STAT;
  }
};

// Fetch data periodically
const intervalStream$ = intervalBeat$.pipe(
  mergeMap(() => {
    const savingsStatMaps = SUPPORTED_SAVINGS_NETWORKS.map(network =>
      from(fetchData(network)).pipe(map(stat => ({ [network]: stat } as SavingsStatMap))),
    );

    return merge(...savingsStatMaps);
  }),
);

// fetch when app event fire
const appEventsStream$ = appEvent$.pipe(
  mergeMap(() => {
    const savingsStatMaps = SUPPORTED_SAVINGS_NETWORKS.map(network =>
      from(fetchData(network)).pipe(map(stat => ({ [network]: stat } as SavingsStatMap))),
    );

    return merge(...savingsStatMaps);
  }),
);

// merge all streams into one
const stream$ = merge(intervalStream$, appEventsStream$).pipe(
  scan(
    (allSavingsStats, savingsStats) => ({
      ...allSavingsStats,
      ...savingsStats,
    }),
    {} as SavingsStatMap,
  ),
  debounce<SavingsStatMap>(() => interval(DEBOUNCE_IN_MS)),
  tap(allSavingsStats => savingsStats$.next(allSavingsStats)),
);

export const [useSavingsStats] = bind(savingsStats$, DEFAULT_VALUE);

let subscription: Subscription;

export const subscribeSavingsStats = (): void => {
  unsubscribeSavingsStats();
  subscription = stream$.subscribe();
};
export const unsubscribeSavingsStats = (): void => subscription?.unsubscribe();
export const resetSavingsStats = (): void => savingsStats$.next(DEFAULT_VALUE);

subscribeSavingsStats();
