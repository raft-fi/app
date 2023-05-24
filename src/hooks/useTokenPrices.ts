import { bind } from '@react-rxjs/core';
import {
  interval,
  BehaviorSubject,
  Observable,
  startWith,
  distinctUntilChanged,
  combineLatest,
  mergeMap,
  map,
  from,
  merge,
  scan,
  debounce,
  tap,
  Subscription,
} from 'rxjs';
import axios from 'axios';
import { CollateralToken, PriceFeed, R_TOKEN, TOKENS, Token } from '@raft-fi/sdk';
import { Decimal } from '@tempusfinance/decimal';
import { DEBOUNCE_IN_MS, POLLING_INTERVAL_IN_MS } from '../constants';
import { Nullable } from '../interfaces';
import { priceFeed$ } from './usePriceFeed';

export type TokenPriceMap = {
  [token in Token]: Nullable<Decimal>;
};

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/simple/price?ids={TOKEN_ID}&vs_currencies=usd';
const COINGECKO_TOKEN_ID_MAP: { [token in CollateralToken]: string } = {
  ETH: 'ethereum',
  stETH: 'staked-ether',
  wstETH: 'wrapped-steth',
};

const DEFAULT_VALUE: TokenPriceMap = TOKENS.reduce(
  (map, token) => ({
    ...map,
    [token]: null,
  }),
  {} as TokenPriceMap,
);

const intervalBeat$: Observable<number> = interval(POLLING_INTERVAL_IN_MS).pipe(startWith(0));

const rawTokenPrices$ = new BehaviorSubject<TokenPriceMap>(DEFAULT_VALUE);
export const tokenPrices$ = rawTokenPrices$.pipe(
  distinctUntilChanged(
    (previous, current) =>
      Object.keys(current).length === Object.keys(previous).length &&
      Object.keys(current).every(token => current[token].equals(previous[token])),
  ),
);

const fetchData = async (feed: PriceFeed, token: Token): Promise<Nullable<Decimal>> => {
  try {
    // TODO: SDK should support multiple token price fetch, update later
    return feed.getPrice(token);
  } catch (error) {
    return fetchFallbackData(token);
  }
};

const fetchFallbackData = async (token: Token): Promise<Nullable<Decimal>> => {
  try {
    if (token === R_TOKEN) {
      return new Decimal(1);
    }

    const coingeckoTokenId = COINGECKO_TOKEN_ID_MAP[token];
    const response = await axios.get(COINGECKO_API_URL.replace('{TOKEN_ID}', coingeckoTokenId));

    return new Decimal(response.data[coingeckoTokenId].usd);
  } catch (error) {
    console.error(`useTokenPrices - Fail to get token price for ${token}`, error);
    return null;
  }
};

// stream$ for periodic polling to fetch data
const periodicStream$: Observable<TokenPriceMap> = combineLatest([priceFeed$, intervalBeat$]).pipe(
  mergeMap<[PriceFeed, number], Observable<TokenPriceMap>>(([feed]) => {
    const tokenPriceMaps = TOKENS.map(token =>
      from(fetchData(feed, token)).pipe(map(price => ({ [token]: price } as TokenPriceMap))),
    );

    return merge(...tokenPriceMaps);
  }),
);

// merge all stream$ into one, use merge() for multiple
const stream$ = periodicStream$.pipe(
  scan(
    (allPrices, tokenPrices) => ({
      ...allPrices,
      ...tokenPrices,
    }),
    {} as TokenPriceMap,
  ),
  debounce<TokenPriceMap>(() => interval(DEBOUNCE_IN_MS)),
  tap(allPrices => rawTokenPrices$.next(allPrices)),
);

export const [useTokenPrices] = bind(tokenPrices$, DEFAULT_VALUE);

let subscription: Subscription;

export const subscribeTokenPrices = (): void => {
  unsubscribeTokenPrices();
  subscription = stream$.subscribe();
};
export const unsubscribeTokenPrices = (): void => subscription?.unsubscribe?.();
export const resetTokenPrices = (): void => rawTokenPrices$.next(DEFAULT_VALUE);
