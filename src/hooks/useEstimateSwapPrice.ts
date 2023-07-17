import { PositionWithRunner, SwapRouter, UnderlyingCollateralToken } from '@raft-fi/sdk';
import { bind } from '@react-rxjs/core';
import { createSignal } from '@react-rxjs/utils';
import { Decimal } from '@tempusfinance/decimal';
import { BehaviorSubject, from, of, concatMap, Subscription, tap, combineLatest, catchError } from 'rxjs';
import { Nullable, SupportedSwapToken } from '../interfaces';
import { provider$ } from './useProvider';

const DEFAULT_VALUE: EstimateSwapPriceStatus = {
  pending: false,
  request: null,
  result: null,
};

interface EstimateSwapPriceRequest {
  underlyingCollateralToken: UnderlyingCollateralToken;
  amountToSwap: Decimal;
  fromToken: SupportedSwapToken;
  toToken: SupportedSwapToken;
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

const stream$ = combineLatest([estimateSwapPriceRequest$, provider$]).pipe(
  concatMap(([request, provider]) => {
    const { underlyingCollateralToken, amountToSwap, fromToken, toToken, router, slippage } = request;

    if (!underlyingCollateralToken || amountToSwap.isZero() || !provider) {
      return of({
        request,
        result: null,
      } as EstimateSwapPriceResponse);
    }

    try {
      const dummyAddress = '0x0'; // the address doesnt matter
      const runner = new PositionWithRunner(dummyAddress, provider, underlyingCollateralToken);

      swapPriceStatus$.next({ pending: true, request, result: null });

      return from(runner.getSwapPrice(amountToSwap, slippage, fromToken, toToken, router)).pipe(
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
