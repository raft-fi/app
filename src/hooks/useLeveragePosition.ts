import { bind } from '@react-rxjs/core';
import { R_TOKEN } from '@raft-fi/sdk';
import { Subscription, BehaviorSubject, combineLatest, map, tap } from 'rxjs';
import { Position, LeveragePosition, Nullable } from '../interfaces';
import { position$ } from './usePosition';
import { TokenPriceMap, tokenPrices$ } from './useTokenPrices';
import { getDecimalFromTokenMap } from '../utils';
import { Decimal } from '@tempusfinance/decimal';

export const leveragePosition$ = new BehaviorSubject<Nullable<LeveragePosition>>(null);

const stream$ = combineLatest([position$, tokenPrices$]).pipe(
  map<[Nullable<Position>, TokenPriceMap], LeveragePosition>(([position, tokenPrices]) => {
    if (!position || !position.hasPosition || !position.principalCollateralBalance) {
      return {
        ...position,
        hasLeveragePosition: false,
        effectiveLeverage: Decimal.ZERO,
      } as LeveragePosition;
    }

    const tokenPrice = getDecimalFromTokenMap(tokenPrices, position.underlyingCollateralToken);
    const rPrice = getDecimalFromTokenMap(tokenPrices, R_TOKEN);

    if (!tokenPrice || !rPrice || rPrice.isZero()) {
      return {
        ...position,
        hasLeveragePosition: false,
        effectiveLeverage: Decimal.ZERO,
      } as LeveragePosition;
    }

    const relativePrice = tokenPrice.div(rPrice);
    const finalCollateralWithPrice = position.collateralBalance.mul(relativePrice);

    if (finalCollateralWithPrice.equals(position.debtBalance)) {
      return {
        ...position,
        hasLeveragePosition: false,
        effectiveLeverage: Decimal.ZERO,
      } as LeveragePosition;
    }

    const effectiveLeverage = finalCollateralWithPrice.div(finalCollateralWithPrice.sub(position.debtBalance));

    return {
      ...position,
      hasLeveragePosition: true,
      effectiveLeverage,
    } as LeveragePosition;
  }),
  tap(leveragePosition => {
    leveragePosition$.next(leveragePosition);
  }),
);

export const [useLeveragePosition] = bind(leveragePosition$, null);

let subscription: Subscription;

export const subscribeLeveragePosition = (): void => {
  unsubscribeLeveragePosition();
  subscription = stream$.subscribe();
};
export const unsubscribeLeveragePosition = (): void => subscription?.unsubscribe();
export const resetLeveragePosition = (): void => {
  leveragePosition$.next(null);
};
