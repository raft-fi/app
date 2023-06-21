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
import { Allowance, RaftConfig, Token } from '@raft-fi/sdk';
import { Decimal } from '@tempusfinance/decimal';
import { DEBOUNCE_IN_MS, POLLING_INTERVAL_IN_MS, SUPPORTED_TOKENS, TOKEN_TO_UNDERLYING_TOKEN_MAP } from '../constants';
import { Nullable, TokenDecimalMap } from '../interfaces';
import { walletAddress$ } from './useWalletAddress';
import { provider$ } from './useProvider';
import { AppEvent, appEvent$ } from './useAppEvent';

export type TokenAllowanceMap = TokenDecimalMap<Token>;

const DEFAULT_VALUE: TokenAllowanceMap = SUPPORTED_TOKENS.reduce(
  (map, token) => ({
    ...map,
    [token]: null,
  }),
  {} as TokenAllowanceMap,
);

const getPositionManager = (token: Token) => {
  if (token === 'R') {
    return RaftConfig.networkConfig.positionManager;
  }

  return RaftConfig.getPositionManagerAddress(TOKEN_TO_UNDERLYING_TOKEN_MAP[token], token);
};

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
  withLatestFrom(provider$),
  mergeMap<[Nullable<string>, JsonRpcProvider], Observable<TokenAllowanceMap>>(([walletAddress, provider]) => {
    if (!walletAddress) {
      return of(DEFAULT_VALUE);
    }

    const tokenAllowanceMaps = SUPPORTED_TOKENS.map(token =>
      from(fetchData(token, walletAddress, getPositionManager(token), provider)).pipe(
        map(allowance => ({ [token]: allowance } as TokenAllowanceMap)),
      ),
    );

    return merge(...tokenAllowanceMaps);
  }),
);

type PeriodicStreamInput = [[number], Nullable<string>, JsonRpcProvider];

// stream$ for periodic polling to fetch data
const periodicStream$: Observable<TokenAllowanceMap> = combineLatest([intervalBeat$]).pipe(
  withLatestFrom(walletAddress$, provider$),
  mergeMap<PeriodicStreamInput, Observable<TokenAllowanceMap>>(([, walletAddress, provider]) => {
    if (!walletAddress) {
      return of(DEFAULT_VALUE);
    }

    const tokenAllowanceMaps = SUPPORTED_TOKENS.map(token =>
      from(fetchData(token, walletAddress, getPositionManager(token), provider)).pipe(
        map(allowance => ({ [token]: allowance } as TokenAllowanceMap)),
      ),
    );

    return merge(...tokenAllowanceMaps);
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
    const tokenAllowanceMaps = SUPPORTED_TOKENS.map(token =>
      from(fetchData(token, walletAddress, getPositionManager(token), provider)).pipe(
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
