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
import { RaftConfig, UserPosition } from '@raft-fi/sdk';
import {
  DEBOUNCE_IN_MS,
  POLLING_INTERVAL_IN_MS,
  SUPPORTED_COLLATERAL_TOKENS,
  TOKEN_TO_UNDERLYING_TOKEN_MAP,
} from '../constants';
import { Nullable, Position, SupportedCollateralToken, TokenGenericMap } from '../interfaces';
import { walletAddress$ } from './useWalletAddress';
import { AppEvent, appEvent$ } from './useAppEvent';
import { walletSigner$ } from './useWalletSigner';
import { position$ } from './usePosition';
import { getNullTokenMap } from '../utils';

export type TokenWhitelistMap = TokenGenericMap<SupportedCollateralToken, Nullable<boolean>>;

const DEFAULT_VALUE: TokenWhitelistMap = getNullTokenMap<SupportedCollateralToken>(SUPPORTED_COLLATERAL_TOKENS);

const intervalBeat$: Observable<number> = interval(POLLING_INTERVAL_IN_MS).pipe(startWith(0));

export const tokenWhitelists$ = new BehaviorSubject<TokenWhitelistMap>(DEFAULT_VALUE);

const fetchData = async (
  token: SupportedCollateralToken,
  walletSigner: Signer,
  position: Position,
): Promise<Nullable<boolean>> => {
  try {
    const underlyingCollateralToken = TOKEN_TO_UNDERLYING_TOKEN_MAP[token];

    const userPosition = new UserPosition(
      walletSigner,
      underlyingCollateralToken,
      position.collateralBalance,
      position.debtBalance,
    );

    const positionManagerAddress = RaftConfig.getPositionManagerAddress(underlyingCollateralToken, token);

    const result = await userPosition.isDelegateWhitelisted(positionManagerAddress, await walletSigner.getAddress());

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
  position$,
]).pipe(
  mergeMap<[Nullable<string>, Nullable<Signer>, Nullable<Position>], Observable<TokenWhitelistMap>>(
    ([walletAddress, walletSigner, position]) => {
      if (!walletAddress || !walletSigner || !position) {
        return of(DEFAULT_VALUE);
      }

      const tokenWhitelistMaps = SUPPORTED_COLLATERAL_TOKENS.map(token =>
        from(fetchData(token, walletSigner, position)).pipe(
          map(isWhitelisted => ({ [token]: isWhitelisted } as TokenWhitelistMap)),
        ),
      );

      return merge(...tokenWhitelistMaps);
    },
  ),
);

type PeriodicStreamInput = [[number], Nullable<Signer>, Nullable<Position>];

// stream$ for periodic polling to fetch data
const periodicStream$: Observable<TokenWhitelistMap> = combineLatest([intervalBeat$]).pipe(
  withLatestFrom(walletSigner$, position$),
  mergeMap<PeriodicStreamInput, Observable<TokenWhitelistMap>>(([, walletSigner, position]) => {
    if (!walletSigner || !position) {
      return of(DEFAULT_VALUE);
    }

    const tokenWhitelistMaps = SUPPORTED_COLLATERAL_TOKENS.map(token =>
      from(fetchData(token, walletSigner, position)).pipe(
        map(isWhitelisted => ({ [token]: isWhitelisted } as TokenWhitelistMap)),
      ),
    );

    return merge(...tokenWhitelistMaps);
  }),
);

// fetch when app event fire
const appEventsStream$ = appEvent$.pipe(
  withLatestFrom(walletAddress$, walletSigner$, position$),
  filter<[Nullable<AppEvent>, Nullable<string>, Nullable<Signer>, Nullable<Position>]>(
    ([, walletAddress, walletSigner, position]) => Boolean(walletAddress) && Boolean(walletSigner) && Boolean(position),
  ),
  mergeMap(([, , walletSigner, position]) => {
    const tokenWhitelistMaps = SUPPORTED_COLLATERAL_TOKENS.map(token =>
      from(fetchData(token, walletSigner as Signer, position as Position)).pipe(
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
