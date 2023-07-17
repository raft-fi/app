import { JsonRpcProvider } from 'ethers';
import { bind } from '@react-rxjs/core';
import {
  interval,
  BehaviorSubject,
  Observable,
  startWith,
  combineLatest,
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
import { Balance } from '@raft-fi/sdk';
import { Decimal } from '@tempusfinance/decimal';
import { DEBOUNCE_IN_MS, POLLING_INTERVAL_IN_MS, SUPPORTED_TOKENS } from '../constants';
import { Nullable, SupportedToken, TokenDecimalMap } from '../interfaces';
import { walletAddress$ } from './useWalletAddress';
import { provider$ } from './useProvider';
import { AppEvent, appEvent$ } from './useAppEvent';
import { getNullTokenMap } from '../utils';

export type TokenBalanceMap = TokenDecimalMap<SupportedToken>;

const DEFAULT_VALUE: TokenBalanceMap = getNullTokenMap<SupportedToken>(SUPPORTED_TOKENS);

const intervalBeat$: Observable<number> = interval(POLLING_INTERVAL_IN_MS).pipe(startWith(0));

export const tokenBalances$ = new BehaviorSubject<TokenBalanceMap>(DEFAULT_VALUE);

const fetchData = async (
  token: SupportedToken,
  walletAddress: string,
  provider: JsonRpcProvider,
): Promise<Nullable<Decimal>> => {
  try {
    const balance = new Balance(token, walletAddress, provider);

    const result = await balance.fetchBalance();

    return result;
  } catch (error) {
    console.error(`useTokenBalances - Failed to get token balance for ${token}`, error);
    return null;
  }
};

// Fetch new balance data every time wallet address changes
const walletChangeStream$: Observable<TokenBalanceMap> = walletAddress$.pipe(
  withLatestFrom(provider$),
  mergeMap<[Nullable<string>, JsonRpcProvider], Observable<TokenBalanceMap>>(([walletAddress, provider]) => {
    if (!walletAddress) {
      return of(DEFAULT_VALUE);
    }

    const tokenBalanceMaps: Observable<TokenBalanceMap>[] = SUPPORTED_TOKENS.map(token =>
      from(fetchData(token, walletAddress, provider)).pipe(map(balance => ({ [token]: balance } as TokenBalanceMap))),
    );

    return merge(...tokenBalanceMaps);
  }),
);

type PeriodicStreamInput = [[number], Nullable<string>, JsonRpcProvider];

// stream$ for periodic polling to fetch data
const periodicStream$: Observable<TokenBalanceMap> = combineLatest([intervalBeat$]).pipe(
  withLatestFrom(walletAddress$, provider$),
  mergeMap<PeriodicStreamInput, Observable<TokenBalanceMap>>(([, walletAddress, provider]) => {
    if (!walletAddress) {
      return of(DEFAULT_VALUE);
    }

    const tokenBalanceMaps = SUPPORTED_TOKENS.map(token =>
      from(fetchData(token, walletAddress, provider)).pipe(map(balance => ({ [token]: balance } as TokenBalanceMap))),
    );

    return merge(...tokenBalanceMaps);
  }),
);

// fetch when app event fire
const appEventsStream$ = appEvent$.pipe(
  withLatestFrom(walletAddress$, provider$),
  filter((value): value is [AppEvent, string, JsonRpcProvider] => {
    const [, walletAddress] = value;

    return Boolean(walletAddress);
  }),
  mergeMap(([, walletAddress, provider]) => {
    const tokenBalanceMaps = SUPPORTED_TOKENS.map(token =>
      from(fetchData(token, walletAddress, provider)).pipe(map(balance => ({ [token]: balance } as TokenBalanceMap))),
    );

    return merge(...tokenBalanceMaps);
  }),
);

// merge all stream$ into one, use merge() for multiple
const stream$ = merge(periodicStream$, walletChangeStream$, appEventsStream$).pipe(
  scan(
    (allBalances, tokenBalances) => ({
      ...allBalances,
      ...tokenBalances,
    }),
    {} as TokenBalanceMap,
  ),
  debounce<TokenBalanceMap>(() => interval(DEBOUNCE_IN_MS)),
  tap(allBalances => tokenBalances$.next(allBalances)),
);

export const [useTokenBalances] = bind(tokenBalances$, DEFAULT_VALUE);

let subscription: Subscription;

export const subscribeTokenBalances = (): void => {
  unsubscribeTokenBalances();
  subscription = stream$.subscribe();
};
export const unsubscribeTokenBalances = (): void => subscription?.unsubscribe();
export const resetTokenBalances = (): void => tokenBalances$.next(DEFAULT_VALUE);
