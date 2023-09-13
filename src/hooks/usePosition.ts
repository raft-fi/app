import { bind } from '@react-rxjs/core';
import {
  from,
  merge,
  tap,
  filter,
  Observable,
  debounce,
  interval,
  Subscription,
  concatMap,
  BehaviorSubject,
  withLatestFrom,
  combineLatest,
} from 'rxjs';
import { Decimal } from '@tempusfinance/decimal';
import { JsonRpcSigner } from 'ethers';
import { DEBOUNCE_IN_MS } from '../constants';
import { Nullable, Position } from '../interfaces';
import { AppEvent, appEvent$ } from './useAppEvent';
import { R_TOKEN, UserPosition } from '@raft-fi/sdk';
import { walletSigner$ } from './useWalletSigner';
import { getDecimalFromTokenMap } from '../utils';
import { TokenPriceMap, tokenPrices$ } from './useTokenPrices';

type NullablePosition = Nullable<Position>;
export const position$ = new BehaviorSubject<NullablePosition>(null);

const fetchData = async (signer: Nullable<JsonRpcSigner>, tokenPrices: TokenPriceMap): Promise<NullablePosition> => {
  if (!signer) {
    return null;
  }

  try {
    const userPosition = await UserPosition.fromUser(signer);

    // no position
    if (!userPosition) {
      return {
        ownerAddress: signer.address,
        underlyingCollateralToken: null,
        hasPosition: false,
        hasLeveragePosition: false,
        collateralBalance: Decimal.ZERO,
        debtBalance: Decimal.ZERO,
        netBalance: Decimal.ZERO,
      };
    }

    const underlyingCollateralToken = userPosition.getUnderlyingCollateralToken();
    const collateralBalance = userPosition.getCollateral();
    const debtBalance = userPosition.getDebt();
    const hasPosition = underlyingCollateralToken && collateralBalance.gt(0) && debtBalance.gt(0);

    const collateralPrice = getDecimalFromTokenMap(tokenPrices, underlyingCollateralToken);
    const debtPrice = getDecimalFromTokenMap(tokenPrices, R_TOKEN);
    const collateralValue = collateralPrice?.mul(collateralBalance) ?? null;
    const debtValue = debtPrice?.mul(debtBalance) ?? null;
    const netValue = collateralValue && debtValue ? collateralValue.sub(debtValue) : null;
    const netBalance = collateralPrice && netValue ? netValue.div(collateralPrice) : null;
    const isInterestRate = userPosition.isInterestRate;

    return {
      ownerAddress: signer.address,
      underlyingCollateralToken,
      hasPosition,
      hasLeveragePosition: hasPosition && userPosition.getIsLeveraged(),
      collateralBalance,
      debtBalance,
      netBalance,
      vaultVersion: isInterestRate ? 'v2' : 'v1',
    };
  } catch (error) {
    console.error('usePosition (catch) - failed to fetch collateral balance!', error);
    return null;
  }
};

// Stream that fetches collateral balance for currently connected wallet, this happens only when wallet address changes
const walletStream$ = combineLatest([walletSigner$, tokenPrices$]).pipe(
  concatMap<[Nullable<JsonRpcSigner>, TokenPriceMap], Observable<NullablePosition>>(([signer, tokenPrices]) =>
    from(fetchData(signer, tokenPrices)),
  ),
);

// fetch when app event fire
const appEventsStream$ = appEvent$.pipe(
  withLatestFrom(walletSigner$, tokenPrices$),
  filter((value): value is [AppEvent, JsonRpcSigner, TokenPriceMap] => {
    const [appEvent, signer] = value;

    return Boolean(signer && appEvent?.metadata?.underlyingCollateralToken && appEvent?.metadata);
  }),
  concatMap(([, signer, tokenPrices]) => from(fetchData(signer, tokenPrices))),
);

// merge all stream$ into one if there are multiple
const stream$ = merge(walletStream$, appEventsStream$).pipe(
  debounce<NullablePosition>(() => interval(DEBOUNCE_IN_MS)),
  tap(position => position$.next(position)),
);

export const [usePosition] = bind(position$, null);

let subscription: Subscription;

export const subscribePosition = (): void => {
  unsubscribePosition();
  subscription = stream$.subscribe();
};
export const unsubscribePosition = (): void => subscription?.unsubscribe();
export const resetPosition = (): void => {
  position$.next(null);
};
