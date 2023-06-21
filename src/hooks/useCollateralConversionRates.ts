import { PriceFeed } from '@raft-fi/sdk';
import { bind } from '@react-rxjs/core';
import {
  from,
  of,
  merge,
  tap,
  Observable,
  catchError,
  debounce,
  interval,
  Subscription,
  BehaviorSubject,
  withLatestFrom,
  startWith,
  mergeMap,
  map,
  scan,
} from 'rxjs';
import { Decimal } from '@tempusfinance/decimal';
import {
  SUPPORTED_COLLATERAL_TOKENS,
  DEBOUNCE_IN_MS,
  POLLING_INTERVAL_IN_MS,
  TOKEN_TO_UNDERLYING_TOKEN_MAP,
  SUPPORTED_COLLATERAL_TOKEN_SETTINGS,
} from '../constants';
import { SupportedCollateralToken, TokenDecimalMap } from '../interfaces';
import { TokenPriceMap, tokenPrices$ } from './useTokenPrices';
import { priceFeed$ } from './usePriceFeed';

export type CollateralConversionRateMap = TokenDecimalMap<SupportedCollateralToken>;

const DEFAULT_VALUE: CollateralConversionRateMap = SUPPORTED_COLLATERAL_TOKENS.reduce(
  (map, token) => ({
    ...map,
    [token]: null,
  }),
  {} as CollateralConversionRateMap,
);

export const collateralConversionRates$ = new BehaviorSubject<CollateralConversionRateMap>(DEFAULT_VALUE);

const fetchData = (feed: PriceFeed, collateralToken: SupportedCollateralToken) => {
  try {
    return from(feed.getUnderlyingCollateralRate(TOKEN_TO_UNDERLYING_TOKEN_MAP[collateralToken], collateralToken)).pipe(
      catchError(error => {
        console.error(`useCollateralConversionRate - failed to fetch conversion rate for ${collateralToken}!`, error);
        return of(null);
      }),
    );
  } catch (error) {
    console.error(
      `useCollateralConversionRate - error thrown when fetching conversion rate for ${collateralToken}!`,
      error,
    );
    return of(null);
  }
};

const intervalBeat$: Observable<number> = interval(POLLING_INTERVAL_IN_MS).pipe(startWith(0));

// stream$ for periodic polling to fetch data
const periodicStream$: Observable<CollateralConversionRateMap> = intervalBeat$.pipe(
  withLatestFrom(tokenPrices$, priceFeed$),
  mergeMap<[number, TokenPriceMap, PriceFeed], Observable<CollateralConversionRateMap>>(
    ([, tokenPrices, priceFeed]) => {
      const collateralConversionRateMaps = SUPPORTED_COLLATERAL_TOKENS.map(token => {
        // since wstETH price only updated per day, we need to call feed.getUnderlyingCollateralRate() only for wstETH group
        if (SUPPORTED_COLLATERAL_TOKEN_SETTINGS.wstETH.tokens.includes(token)) {
          const displayBaseToken = SUPPORTED_COLLATERAL_TOKEN_SETTINGS.wstETH
            .displayBaseToken as SupportedCollateralToken;
          const underlyingToken = SUPPORTED_COLLATERAL_TOKEN_SETTINGS.wstETH.underlyingToken;

          // if wstETH is the display token, conversion rate = 1
          if (underlyingToken === displayBaseToken) {
            return of({
              [token]: Decimal.ONE,
            } as CollateralConversionRateMap);
          }

          // token is underlying token, conversion rate = 1
          if (token === underlyingToken) {
            return of({
              [token]: Decimal.ONE,
            } as CollateralConversionRateMap);
          }

          // get the rate of underlying token to current token
          return from(fetchData(priceFeed, token)).pipe(
            map(
              conversionRate =>
                ({
                  [token]: conversionRate,
                } as CollateralConversionRateMap),
            ),
          );
        }

        const underlyingToken = TOKEN_TO_UNDERLYING_TOKEN_MAP[token];

        // token is underlying token, conversion rate = 1
        if (token === underlyingToken) {
          return of({
            [token]: Decimal.ONE,
          } as CollateralConversionRateMap);
        }

        const underlyingTokenRate = tokenPrices[underlyingToken];
        const tokenRate = tokenPrices[token];

        // conversion rate = token rate / underlying token rate
        if (underlyingTokenRate && tokenRate && !underlyingTokenRate.isZero()) {
          return of({
            [token]: tokenRate.div(underlyingTokenRate),
          } as CollateralConversionRateMap);
        }

        return of({
          [token]: null,
        } as CollateralConversionRateMap);
      });

      return merge(...collateralConversionRateMaps);
    },
  ),
);

// merge all stream$ into one if there are multiple
const stream$ = merge(periodicStream$).pipe(
  scan(
    (allCollateralConversionRates, collateralConversionRates) => ({
      ...allCollateralConversionRates,
      ...collateralConversionRates,
    }),
    {} as CollateralConversionRateMap,
  ),
  debounce<CollateralConversionRateMap>(() => interval(DEBOUNCE_IN_MS)),
  tap(allCollateralConversionRates => collateralConversionRates$.next(allCollateralConversionRates)),
);

export const [useCollateralConversionRates] = bind(collateralConversionRates$, null);

let subscription: Subscription;

export const subscribeCollateralConversionRates = (): void => {
  unsubscribeCollateralConversionRates();
  subscription = stream$.subscribe();
};
export const unsubscribeCollateralConversionRates = (): void => subscription?.unsubscribe();
export const resetCollateralConversionRates = (): void => {
  collateralConversionRates$.next(DEFAULT_VALUE);
};
