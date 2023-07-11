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
import { Nullable, Position } from '../interfaces';
import { AppEvent, appEvent$ } from './useAppEvent';
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
        collateralBalance: Decimal.ZERO,
        debtBalance: Decimal.ZERO,
        principalCollateralBalance: null,
      };
    }

    return {
      ownerAddress: signer.address,
      underlyingCollateralToken: userPosition.getUnderlyingCollateralToken(),
      collateralBalance: userPosition.getCollateral(),
      debtBalance: userPosition.getDebt(),
      principalCollateralBalance: userPosition.getPrincipalCollateral(),
    };
  } catch (error) {
    console.error('usePosition (catch) - failed to fetch collateral balance!', error);
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
    const [, signer] = value;

    return Boolean(signer);
  }),
  concatMap(([, signer]) => fetchData(signer)),
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
