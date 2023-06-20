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
import { UnderlyingCollateralToken, UNDERLYING_COLLATERAL_TOKENS, UserPosition } from '@raft-fi/sdk';
import { walletSigner$ } from './useWalletSigner';

export const position$ = new BehaviorSubject<Nullable<Position>>(null);

// TODO: update SDK to support 1 query to get the underlying token
const fetchPositionUnderlyingCollateralToken = async (
  signer: JsonRpcSigner,
): Promise<Nullable<UnderlyingCollateralToken>> => {
  const positions = await Promise.all(
    UNDERLYING_COLLATERAL_TOKENS.map(async token => {
      const userPosition = new UserPosition(signer, Decimal.ZERO, Decimal.ZERO, token);
      const collateralBalance = await userPosition.fetchCollateral();

      return {
        underlyingCollateralToken: token,
        collateralBalance,
        debtBalance: Decimal.ZERO,
      };
    }),
  );

  const position = positions.find(pos => pos.collateralBalance.gt(0));

  return position ? position.underlyingCollateralToken : null;
};

const fetchData = async (signer: Nullable<JsonRpcSigner>): Promise<Nullable<Position>> => {
  if (!signer) {
    return null;
  }

  try {
    const underlyingCollateralToken = await fetchPositionUnderlyingCollateralToken(signer);

    // no position
    if (!underlyingCollateralToken) {
      return {
        underlyingCollateralToken: null,
        collateralBalance: Decimal.ZERO,
        debtBalance: Decimal.ZERO,
      };
    }

    const userPosition = new UserPosition(signer, Decimal.ZERO, Decimal.ZERO, underlyingCollateralToken);
    await userPosition.fetch();

    return {
      underlyingCollateralToken,
      collateralBalance: userPosition.getCollateral(),
      debtBalance: userPosition.getDebt(),
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
