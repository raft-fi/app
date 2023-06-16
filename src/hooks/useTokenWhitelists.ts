import { Signer } from 'ethers';
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
import { UserPosition, Token, CollateralToken } from '@raft-fi/sdk';
import { Decimal } from '@tempusfinance/decimal';
import {
  DEBOUNCE_IN_MS,
  POLLING_INTERVAL_IN_MS,
  SUPPORTED_COLLATERAL_TOKENS,
  TOKEN_TO_UNDERLYING_TOKEN_MAP,
} from '../constants';
import { Nullable } from '../interfaces';
import { walletAddress$ } from './useWalletAddress';
import { AppEvent, appEvent$ } from './useAppEvent';
import { walletSigner$ } from './useWalletSigner';
import { collateralBalance$ } from './useCollateralBalance';
import { debtBalance$ } from './useDebtBalance';

export type TokenWhitelistMap = {
  [token in Token]: Nullable<boolean>;
};

const DEFAULT_VALUE: TokenWhitelistMap = SUPPORTED_COLLATERAL_TOKENS.reduce(
  (map, token) => ({
    ...map,
    [token]: null,
  }),
  {} as TokenWhitelistMap,
);

const intervalBeat$: Observable<number> = interval(POLLING_INTERVAL_IN_MS).pipe(startWith(0));

export const tokenWhitelists$ = new BehaviorSubject<TokenWhitelistMap>(DEFAULT_VALUE);

const fetchData = async (
  token: CollateralToken,
  walletSigner: Signer,
  collateral: Decimal,
  debt: Decimal,
): Promise<Nullable<boolean>> => {
  try {
    const position = new UserPosition(walletSigner, collateral, debt, TOKEN_TO_UNDERLYING_TOKEN_MAP[token]);

    const result = await position.isDelegateWhitelisted(token);

    return result;
  } catch (error) {
    console.error(`useTokenWhitelists - Failed to get token whitelist for ${token}`, error);
    return null;
  }
};

// Fetch new whitelist data every time wallet address changes
const walletChangeStream$: Observable<TokenWhitelistMap> = combineLatest([
  walletAddress$,
  walletSigner$,
  collateralBalance$,
  debtBalance$,
]).pipe(
  mergeMap<[Nullable<string>, Nullable<Signer>, Nullable<Decimal>, Nullable<Decimal>], Observable<TokenWhitelistMap>>(
    ([walletAddress, walletSigner, collateral, debt]) => {
      if (!walletAddress || !walletSigner || !collateral || !debt) {
        return of(DEFAULT_VALUE);
      }

      const tokenWhitelistMaps = SUPPORTED_COLLATERAL_TOKENS.map(token =>
        from(fetchData(token, walletSigner, collateral, debt)).pipe(
          map(isWhitelisted => ({ [token]: isWhitelisted } as TokenWhitelistMap)),
        ),
      );

      return merge(...tokenWhitelistMaps);
    },
  ),
);

type PeriodicStreamInput = [[number], Nullable<Signer>, Nullable<Decimal>, Nullable<Decimal>];

// stream$ for periodic polling to fetch data
const periodicStream$: Observable<TokenWhitelistMap> = combineLatest([intervalBeat$]).pipe(
  withLatestFrom(walletSigner$, collateralBalance$, debtBalance$),
  mergeMap<PeriodicStreamInput, Observable<TokenWhitelistMap>>(([, walletSigner, collateral, debt]) => {
    if (!walletSigner || !collateral || !debt) {
      return of(DEFAULT_VALUE);
    }

    const tokenWhitelistMaps = SUPPORTED_COLLATERAL_TOKENS.map(token =>
      from(fetchData(token, walletSigner, collateral, debt)).pipe(
        map(isWhitelisted => ({ [token]: isWhitelisted } as TokenWhitelistMap)),
      ),
    );

    return merge(...tokenWhitelistMaps);
  }),
);

// fetch when app event fire
const appEventsStream$ = appEvent$.pipe(
  withLatestFrom(walletAddress$, walletSigner$, collateralBalance$, debtBalance$),
  filter<[Nullable<AppEvent>, Nullable<string>, Nullable<Signer>, Nullable<Decimal>, Nullable<Decimal>]>(
    ([, walletAddress, walletSigner, collateral, debt]) =>
      Boolean(walletAddress) && Boolean(walletSigner) && Boolean(collateral) && Boolean(debt),
  ),
  mergeMap(([, , walletSigner, collateral, debt]) => {
    const tokenWhitelistMaps = SUPPORTED_COLLATERAL_TOKENS.map(token =>
      from(fetchData(token, walletSigner as Signer, collateral as Decimal, debt as Decimal)).pipe(
        map(isWhitelisted => ({ [token]: isWhitelisted } as TokenWhitelistMap)),
      ),
    );

    return merge(...tokenWhitelistMaps);
  }),
);

// merge all stream$ into one, use merge() for multiple
const stream$ = merge(periodicStream$, walletChangeStream$, appEventsStream$).pipe(
  scan(
    (allWhitelists, tokenWhitelists) => ({
      ...allWhitelists,
      ...tokenWhitelists,
    }),
    {} as TokenWhitelistMap,
  ),
  debounce<TokenWhitelistMap>(() => interval(DEBOUNCE_IN_MS)),
  tap(allWhitelists => tokenWhitelists$.next(allWhitelists)),
);

export const [useTokenWhitelists] = bind(tokenWhitelists$, DEFAULT_VALUE);

let subscription: Subscription;

export const subscribeTokenWhitelists = (): void => {
  unsubscribeTokenWhitelists();
  subscription = stream$.subscribe();
};
export const unsubscribeTokenWhitelists = (): void => subscription?.unsubscribe();
export const resetTokenWhitelists = (): void => tokenWhitelists$.next(DEFAULT_VALUE);
