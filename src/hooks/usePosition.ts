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
} from 'rxjs';
import { Decimal } from '@tempusfinance/decimal';
import { JsonRpcSigner } from 'ethers';
import { DEBOUNCE_IN_MS } from '../constants';
import { Nullable, Position, SupportedUnderlyingCollateralToken } from '../interfaces';
import { AppEvent, appEvent$, AppEventMetadata } from './useAppEvent';
import { UserPosition } from '@raft-fi/sdk';
import { walletSigner$ } from './useWalletSigner';

export const position$ = new BehaviorSubject<Nullable<Position>>(null);

const fetchData = async (signer: Nullable<JsonRpcSigner>): Promise<Nullable<Position>> => {
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
        collateralBalance: Decimal.ZERO,
        debtBalance: Decimal.ZERO,
        principalCollateralBalance: null,
      };
    }

    const underlyingCollateralToken = userPosition.getUnderlyingCollateralToken();
    const collateralBalance = userPosition.getCollateral();
    const debtBalance = userPosition.getDebt();
    const hasPosition = underlyingCollateralToken && collateralBalance.gt(0) && debtBalance.gt(0);

    return {
      ownerAddress: signer.address,
      underlyingCollateralToken,
      hasPosition,
      collateralBalance,
      debtBalance,
      principalCollateralBalance: userPosition.getPrincipalCollateral(),
    };
  } catch (error) {
    console.error('usePosition (catch) - failed to fetch collateral balance!', error);
    return null;
  }
};

// fetch from chain vs fetch from subgraph. from chain is supposed to have most updated
const fetchDataFromChain = async (
  signer: Nullable<JsonRpcSigner>,
  underlyingCollateralToken: Nullable<SupportedUnderlyingCollateralToken>,
  updatedPrincipalCollateralBalance: Nullable<Decimal> = null,
): Promise<Nullable<Position>> => {
  if (!signer || !underlyingCollateralToken) {
    return null;
  }

  try {
    // fetch data from chain manually to get the most updated data
    const userPosition = new UserPosition(signer, underlyingCollateralToken);
    await userPosition.fetch();

    const collateralBalance = userPosition.getCollateral();
    const debtBalance = userPosition.getDebt();
    const hasPosition = collateralBalance.gt(0) && debtBalance.gt(0);

    return {
      ownerAddress: signer.address,
      underlyingCollateralToken,
      hasPosition,
      collateralBalance,
      debtBalance,
      principalCollateralBalance: updatedPrincipalCollateralBalance,
    };
  } catch (error) {
    console.error('usePosition (catch) - failed to fetch collateral balance from chain!', error);
    return null;
  }
};

// Stream that fetches collateral balance for currently connected wallet, this happens only when wallet address changes
const walletStream$ = walletSigner$.pipe(
  concatMap<Nullable<JsonRpcSigner>, Observable<Nullable<Position>>>(signer => from(fetchData(signer))),
);

// fetch when app event fire
const appEventsStream$ = appEvent$.pipe(
  withLatestFrom(walletSigner$),
  filter((value): value is [AppEvent, JsonRpcSigner] => {
    const [appEvent, signer] = value;

    return Boolean(signer && appEvent?.metadata?.underlyingCollateralToken && appEvent?.metadata);
  }),
  concatMap(([appEvent, signer]) => {
    const metadata = appEvent.metadata as AppEventMetadata;

    switch (appEvent.eventType) {
      case 'leverage': {
        const { tokenAmount, currentPrincipalCollateral, underlyingCollateralToken } = metadata;

        if (tokenAmount && currentPrincipalCollateral && underlyingCollateralToken) {
          const updatedPrincipalCollateralBalance = currentPrincipalCollateral.add(tokenAmount);
          return fetchDataFromChain(signer, underlyingCollateralToken, updatedPrincipalCollateralBalance);
        }
      }
    }

    return fetchDataFromChain(signer, metadata.underlyingCollateralToken ?? null);
  }),
);

// merge all stream$ into one if there are multiple
const stream$ = merge(walletStream$, appEventsStream$).pipe(
  debounce<Nullable<Position>>(() => interval(DEBOUNCE_IN_MS)),
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
