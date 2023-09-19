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
import { PriceFeed, R_TOKEN } from '@raft-fi/sdk';
import { Decimal } from '@tempusfinance/decimal';
import { DEBOUNCE_IN_MS, POLLING_INTERVAL_IN_MS, SUPPORTED_TOKENS, SUPPORTED_UNDERLYING_TOKENS } from '../constants';
import { Nullable, TokenDecimalMap } from '../interfaces';
import { priceFeed$ } from './usePriceFeed';
import { getNullTokenMap } from '../utils';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/simple/price?ids={TOKEN_ID}&vs_currencies=usd';
const COINGECKO_TOKEN_ID_MAP: { [token: string]: string } = {
  ETH: 'ethereum',
  stETH: 'staked-ether',
  wstETH: 'wrapped-steth',
};

const TOKENS_TO_FETCH = Array.from(new Set([...SUPPORTED_TOKENS, ...SUPPORTED_UNDERLYING_TOKENS]));
type TokenToFetch = (typeof TOKENS_TO_FETCH)[number];
export type TokenPriceMap = TokenDecimalMap<TokenToFetch>;

const DEFAULT_VALUE: TokenPriceMap = getNullTokenMap<TokenToFetch>(TOKENS_TO_FETCH);

const intervalBeat$: Observable<number> = interval(POLLING_INTERVAL_IN_MS).pipe(startWith(0));

const rawTokenPrices$ = new BehaviorSubject<TokenPriceMap>(DEFAULT_VALUE);
export const tokenPrices$ = rawTokenPrices$.pipe(
  distinctUntilChanged(
    (previous, current) =>
      Object.keys(current).length === Object.keys(previous).length &&
      Object.keys(current).every(token => current[token].equals(previous[token])),
  ),
);

const fetchData = async (feed: PriceFeed, token: TokenToFetch): Promise<Nullable<Decimal>> => {
  try {
    // stETH price is from subgraph, wstETH price from price feed which is more reliable
    if (token === 'stETH') {
      const wstETHPricePromise = feed.getPrice('wstETH');
      const wstETHRatePromise = feed.getUnderlyingCollateralRate('wstETH-v1', 'stETH');
      const [wstETHPrice, wstETHRate] = await Promise.all([wstETHPricePromise, wstETHRatePromise]);
      return wstETHPrice.div(wstETHRate);
    }

    return feed.getPrice(token);
  } catch (error) {
    return fetchFallbackData(token);
  }
};

const fetchFallbackData = async (token: TokenToFetch): Promise<Nullable<Decimal>> => {
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
const periodicStream$: Observable<TokenPriceMap> = combineLatest([intervalBeat$, priceFeed$]).pipe(
  mergeMap<[number, PriceFeed], Observable<TokenPriceMap>>(([, feed]) => {
    const tokenPriceMaps = TOKENS_TO_FETCH.map(token =>
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
