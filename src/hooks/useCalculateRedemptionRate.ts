import { Protocol, UnderlyingCollateralToken } from '@raft-fi/sdk';
import { bind } from '@react-rxjs/core';
import { createSignal } from '@react-rxjs/utils';
import { Decimal } from '@tempusfinance/decimal';
import { BehaviorSubject, from, of, concatMap, Subscription, tap, combineLatest, catchError } from 'rxjs';
import { Nullable } from '../interfaces';
import { getDecimalFromTokenMap } from '../utils';
import { protocolStats$ } from './useProtocolStats';
import { provider$ } from './useProvider';
import { tokenPrices$ } from './useTokenPrices';

const DEFAULT_VALUE = {
  pending: false,
  request: null,
  result: null,
};

interface CalculateRedemptionRateRequest {
  underlyingCollateralToken: UnderlyingCollateralToken;
  tokenAmount: Decimal;
}

interface CalculateRedemptionRateStatus {
  pending: boolean;
  request: Nullable<CalculateRedemptionRateRequest>;
  result: Nullable<Decimal>;
  error?: Error;
}

interface CalculateRedemptionRateResponse {
  request: CalculateRedemptionRateRequest;
  result: Nullable<Decimal>;
}

const [calculateRedemptionRateRequest$, setCalculateRedemptionRateRequest] =
  createSignal<CalculateRedemptionRateRequest>();
const redemptionRateStatus$ = new BehaviorSubject<CalculateRedemptionRateStatus>(DEFAULT_VALUE);

const stream$ = combineLatest([calculateRedemptionRateRequest$, provider$, tokenPrices$, protocolStats$]).pipe(
  concatMap(([request, provider, tokenPrices, protocolStats]) => {
    const { underlyingCollateralToken, tokenAmount } = request;
    const totalRSupply = getDecimalFromTokenMap(protocolStats?.totalRSupply ?? null, underlyingCollateralToken);
    const tokenPrice = getDecimalFromTokenMap(tokenPrices, underlyingCollateralToken);

    if (!underlyingCollateralToken || !tokenAmount || !provider || !tokenPrice || !totalRSupply) {
      return of({
        request,
        result: null,
      } as CalculateRedemptionRateResponse);
    }

    try {
      const protocol = Protocol.getInstance(provider);
      redemptionRateStatus$.next({ pending: true, request, result: null });

      return from(protocol.fetchRedemptionRate(underlyingCollateralToken, tokenAmount, tokenPrice, totalRSupply)).pipe(
        concatMap(rate =>
          of({
            request,
            result: rate,
          } as CalculateRedemptionRateResponse),
        ),
        catchError(error => {
          console.error(
            `useCalculateRedemptionRate (catchError) - failed to calculate redemption rate for ${underlyingCollateralToken}!`,
            error,
          );
          return of({
            request,
            result: null,
            error,
          } as CalculateRedemptionRateResponse);
        }),
      );
    } catch (error) {
      console.error(
        `useCalculateRedemptionRate (catch) - failed to calculate redemption rate for ${underlyingCollateralToken}!`,
        error,
      );
      return of({
        request,
        result: null,
        error,
      } as CalculateRedemptionRateResponse);
    }
  }),
  tap<CalculateRedemptionRateResponse>(response => {
    redemptionRateStatus$.next({ ...response, pending: false });
  }),
);

const [redemptionRateStatus] = bind<CalculateRedemptionRateStatus>(redemptionRateStatus$, DEFAULT_VALUE);

export const useCalculateRedemptionRate = (): {
  redemptionRateStatus: CalculateRedemptionRateStatus;
  calculateRedemptionRate: (payload: CalculateRedemptionRateRequest) => void;
} => ({
  redemptionRateStatus: redemptionRateStatus(),
  calculateRedemptionRate: setCalculateRedemptionRateRequest,
});

let subscriptions: Subscription[];

export const subscribeCalculateRedemptionRate = (): void => {
  unsubscribeCalculateRedemptionRate();
  subscriptions = [stream$.subscribe()];
};
export const unsubscribeCalculateRedemptionRate = (): void =>
  subscriptions?.forEach(subscription => subscription.unsubscribe());
export const resetCalculateRedemptionRate = (): void => {
  redemptionRateStatus$.next(DEFAULT_VALUE);
};
