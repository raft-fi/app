import { PositionWithRunner, R_TOKEN, SwapRouter, UnderlyingCollateralToken } from '@raft-fi/sdk';
import { bind } from '@react-rxjs/core';
import { createSignal } from '@react-rxjs/utils';
import { Decimal } from '@tempusfinance/decimal';
import { BehaviorSubject, from, of, concatMap, Subscription, tap, combineLatest, catchError } from 'rxjs';
import { Nullable } from '../interfaces';
import { getDecimalFromTokenMap } from '../utils';
import { provider$ } from './useProvider';
import { tokenPrices$ } from './useTokenPrices';

const DEFAULT_VALUE = {
  pending: false,
  request: null,
  result: null,
};

interface EstimateSwapPriceRequest {
  underlyingCollateralToken: UnderlyingCollateralToken;
  tokenAmount: Decimal;
  leverage: Decimal;
  router: SwapRouter;
  slippage: Decimal;
}

interface EstimateSwapPriceStatus {
  pending: boolean;
  request: Nullable<EstimateSwapPriceRequest>;
  result: Nullable<Decimal>;
  error?: Error;
}

interface EstimateSwapPriceResponse {
  request: EstimateSwapPriceRequest;
  result: Nullable<Decimal>;
}

const [estimateSwapPriceRequest$, setEstimateSwapPriceRequest] = createSignal<EstimateSwapPriceRequest>();
const swapPriceStatus$ = new BehaviorSubject<EstimateSwapPriceStatus>(DEFAULT_VALUE);

const stream$ = combineLatest([estimateSwapPriceRequest$, provider$, tokenPrices$]).pipe(
  concatMap(([request, provider, tokenPrices]) => {
    const { underlyingCollateralToken, tokenAmount, leverage, router, slippage } = request;
    const tokenPrice = getDecimalFromTokenMap(tokenPrices, underlyingCollateralToken);

    if (!underlyingCollateralToken || tokenAmount.isZero() || leverage.equals(1) || !provider || !tokenPrice) {
      return of({
        request,
        result: null,
      } as EstimateSwapPriceResponse);
    }

    try {
      const dummyAddress = '0x0'; // the address doesnt matter
      const runner = new PositionWithRunner(dummyAddress, provider, underlyingCollateralToken);

      swapPriceStatus$.next({ pending: true, request, result: null });

      return from(
        runner.getSwapPrice(tokenAmount, leverage, slippage, tokenPrice, R_TOKEN, underlyingCollateralToken, router),
      ).pipe(
        concatMap(rate =>
          of({
            request,
            result: rate,
          } as EstimateSwapPriceResponse),
        ),
        catchError(error => {
          console.error(
            `useEstimateSwapPrice (catchError) - failed to estimate swap price for ${underlyingCollateralToken}!`,
            error,
          );
          return of({
            request,
            result: null,
            error,
          } as EstimateSwapPriceResponse);
        }),
      );
    } catch (error) {
      console.error(
        `useEstimateSwapPrice (catch) - failed to estimate swap price for ${underlyingCollateralToken}!`,
        error,
      );
      return of({
        request,
        result: null,
        error,
      } as EstimateSwapPriceResponse);
    }
  }),
  tap<EstimateSwapPriceResponse>(response => {
    swapPriceStatus$.next({ ...response, pending: false });
  }),
);

const [swapPriceStatus] = bind<EstimateSwapPriceStatus>(swapPriceStatus$, DEFAULT_VALUE);

export const useEstimateSwapPrice = (): {
  swapPriceStatus: EstimateSwapPriceStatus;
  estimateSwapPrice: (payload: EstimateSwapPriceRequest) => void;
} => ({
  swapPriceStatus: swapPriceStatus(),
  estimateSwapPrice: setEstimateSwapPriceRequest,
});

let subscriptions: Subscription[];

export const subscribeEstimateSwapPrice = (): void => {
  unsubscribeEstimateSwapPrice();
  subscriptions = [stream$.subscribe()];
};
export const unsubscribeEstimateSwapPrice = (): void =>
  subscriptions?.forEach(subscription => subscription.unsubscribe());
export const resetEstimateSwapPrice = (): void => {
  swapPriceStatus$.next(DEFAULT_VALUE);
};
