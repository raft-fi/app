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
import { Allowance, TOKENS, Token } from '@raft-fi/sdk';
import { Decimal } from '@tempusfinance/decimal';
import { DEBOUNCE_IN_MS, POLLING_INTERVAL_IN_MS } from '../constants';
import { ChainConfig, Nullable } from '../interfaces';
import { walletAddress$ } from './useWalletAddress';
import { provider$ } from './useProvider';
import { AppEvent, appEvent$ } from './useAppEvent';
import { config$ } from './useConfig';

export type TokenAllowanceMap = {
  [token in Token]: Nullable<Decimal>;
};

const DEFAULT_VALUE: TokenAllowanceMap = TOKENS.reduce(
  (map, token) => ({
    ...map,
    [token]: null,
  }),
  {} as TokenAllowanceMap,
);

const intervalBeat$: Observable<number> = interval(POLLING_INTERVAL_IN_MS).pipe(startWith(0));

export const tokenAllowances$ = new BehaviorSubject<TokenAllowanceMap>(DEFAULT_VALUE);

const fetchData = async (
  token: Token,
  walletAddress: string,
  positionManagerAddress: string,
  provider: JsonRpcProvider,
): Promise<Nullable<Decimal>> => {
  try {
    const allowance = new Allowance(token, walletAddress, positionManagerAddress, provider);

    const result = await allowance.fetchAllowance();

    return result;
  } catch (error) {
    console.error(`useTokenAllowances - Failed to get token allowance for ${token}`, error);
    return null;
  }
};

// Fetch new allowance data every time wallet address changes
const walletChangeStream$: Observable<TokenAllowanceMap> = walletAddress$.pipe(
  withLatestFrom(provider$, config$),
  mergeMap<[Nullable<string>, JsonRpcProvider, ChainConfig], Observable<TokenAllowanceMap>>(
    ([walletAddress, provider, config]) => {
      if (!walletAddress) {
        return of(DEFAULT_VALUE);
      }

      const tokenAllowanceMaps = TOKENS.map(token =>
        from(fetchData(token, walletAddress, config.positionManager, provider)).pipe(
          map(allowance => ({ [token]: allowance } as TokenAllowanceMap)),
        ),
      );

      return merge(...tokenAllowanceMaps);
    },
  ),
);

type PeriodicStreamInput = [[number], Nullable<string>, JsonRpcProvider, ChainConfig];

// stream$ for periodic polling to fetch data
const periodicStream$: Observable<TokenAllowanceMap> = combineLatest([intervalBeat$]).pipe(
  withLatestFrom(walletAddress$, provider$, config$),
  mergeMap<PeriodicStreamInput, Observable<TokenAllowanceMap>>(([, walletAddress, provider, config]) => {
    if (!walletAddress) {
      return of(DEFAULT_VALUE);
    }

    const tokenAllowanceMaps = TOKENS.map(token =>
      from(fetchData(token, walletAddress, config.positionManager, provider)).pipe(
        map(allowance => ({ [token]: allowance } as TokenAllowanceMap)),
      ),
    );

    return merge(...tokenAllowanceMaps);
  }),
);

// fetch when app event fire
const appEventsStream$ = appEvent$.pipe(
  withLatestFrom(walletAddress$, provider$, config$),
  filter((value): value is [AppEvent, string, JsonRpcProvider, ChainConfig] => {
    const [, walletAddress] = value;

    return Boolean(walletAddress);
  }),
  mergeMap(([, walletAddress, provider, config]) => {
    const tokenAllowanceMaps = TOKENS.map(token =>
      from(fetchData(token, walletAddress, config.positionManager, provider)).pipe(
        map(allowance => ({ [token]: allowance } as TokenAllowanceMap)),
      ),
    );

    return merge(...tokenAllowanceMaps);
  }),
);

// merge all stream$ into one, use merge() for multiple
const stream$ = merge(periodicStream$, walletChangeStream$, appEventsStream$).pipe(
  scan(
    (allAllowances, tokenAllowances) => ({
      ...allAllowances,
      ...tokenAllowances,
    }),
    {} as TokenAllowanceMap,
  ),
  debounce<TokenAllowanceMap>(() => interval(DEBOUNCE_IN_MS)),
  tap(allAllowances => tokenAllowances$.next(allAllowances)),
);

export const [useTokenAllowances] = bind(tokenAllowances$, DEFAULT_VALUE);

let subscription: Subscription;

export const subscribeTokenAllowances = (): void => {
  unsubscribeTokenAllowances();
  subscription = stream$.subscribe();
};
export const unsubscribeTokenAllowances = (): void => subscription?.unsubscribe();
export const resetTokenAllowances = (): void => tokenAllowances$.next(DEFAULT_VALUE);
