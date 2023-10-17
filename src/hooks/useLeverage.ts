import { v4 as uuid } from 'uuid';
import { ERC20PermitSignatureStruct, LeveragePositionStep, UserPosition } from '@raft-fi/sdk';
import { bind } from '@react-rxjs/core';
import { createSignal } from '@react-rxjs/utils';
import { Decimal } from '@tempusfinance/decimal';
import { BrowserProvider, JsonRpcSigner, TransactionResponse } from 'ethers';
import {
  BehaviorSubject,
  withLatestFrom,
  from,
  of,
  map,
  concatMap,
  Subscription,
  tap,
  combineLatest,
  distinctUntilChanged,
  filter,
  catchError,
} from 'rxjs';
import { GAS_LIMIT_MULTIPLIER, SUPPORTED_UNDERLYING_TOKENS } from '../constants';
import { Nullable, SupportedCollateralToken, SupportedUnderlyingCollateralToken, TokenGenericMap } from '../interfaces';
import { emitAppEvent } from './useAppEvent';
import { notification$ } from './useNotification';
import { wallet$ } from './useWallet';
import { walletSigner$ } from './useWalletSigner';
import { getNullTokenMap, waitForTransactionReceipt } from '../utils';
import { leverageTokenAllowances$ } from './useLeverageTokenAllowances';
import { leverageTokenWhitelists$ } from './useLeverageTokenWhitelist';
import { position$ } from './usePosition';
import { collateralConversionRates$ } from './useCollateralConversionRates';
import { collateralBorrowingRates$ } from './useCollateralBorrowingRates';
import { tokenPrices$ } from './useTokenPrices';

const DEFAULT_VALUE = {
  pending: false,
  statusType: null,
  request: null,
};
const DEFAULT_STEPS = {
  pending: false,
  request: null,
  result: null,
  generator: null,
};

type UserPositionMap = TokenGenericMap<
  SupportedUnderlyingCollateralToken,
  Nullable<UserPosition<SupportedUnderlyingCollateralToken>>
>;
type LeveragePositionStepsGenerator = AsyncGenerator<
  LeveragePositionStep,
  void,
  ERC20PermitSignatureStruct | undefined
>;
type LeveragePositionFunc = () => void;
type RequestLeveragePositionStepFunc = (request: LeveragePositionStepsRequest) => void;
type LeveragePositionStatusType = 'whitelist' | 'approve' | 'permit' | 'leverage';

const userPositionMap: UserPositionMap =
  getNullTokenMap<SupportedUnderlyingCollateralToken>(SUPPORTED_UNDERLYING_TOKENS);

interface LeveragePositionStepsRequest {
  underlyingCollateralToken: SupportedUnderlyingCollateralToken;
  collateralToken: SupportedCollateralToken;
  collateralChange: Decimal;
  leverage: Decimal;
  slippage: Decimal;
  isClosePosition?: boolean;
}

interface LeveragePositionStatus {
  pending: boolean;
  success?: boolean;
  statusType: Nullable<LeveragePositionStatusType>;
  request: Nullable<LeveragePositionStepsRequest>;
  response?: TransactionResponse;
  signature?: ERC20PermitSignatureStruct;
  txHash?: string;
  error?: Error;
}

interface LeveragePositionStepsStatus {
  pending: boolean;
  request: Nullable<LeveragePositionStepsRequest>;
  result: Nullable<LeveragePositionStep>;
  generator: Nullable<LeveragePositionStepsGenerator>;
  error?: Error;
}

interface LeveragePositionStepsResponse {
  request: LeveragePositionStepsRequest;
  result: Nullable<LeveragePositionStep>;
  generator: Nullable<LeveragePositionStepsGenerator>;
}

const [leveragePositionStepsRequest$, setLeveragePositionStepsRequest] = createSignal<LeveragePositionStepsRequest>();
const leveragePositionStepsStatus$ = new BehaviorSubject<LeveragePositionStepsStatus>(DEFAULT_STEPS);
const leveragePositionStatus$ = new BehaviorSubject<LeveragePositionStatus>(DEFAULT_VALUE);

const leveragePosition$ = leveragePositionStepsStatus$.pipe(
  withLatestFrom(wallet$),
  map<[LeveragePositionStepsStatus, Nullable<BrowserProvider>], Nullable<LeveragePositionFunc>>(
    ([status, walletProvider]) => {
      const { pending, request, result, generator, error } = status;

      if (!pending && !error && result && generator && walletProvider) {
        return async () => {
          const notificationId = uuid();
          const statusType = result.type.name;

          try {
            leveragePositionStatus$.next({ pending: true, request, statusType });

            if (statusType === 'approve' || statusType === 'permit') {
              notification$.next({
                notificationId,
                notificationType: 'approval-pending',
                timestamp: Date.now(),
              });
            }

            const response = await result.action();
            const txnResponse = response as TransactionResponse;
            const signature = response as ERC20PermitSignatureStruct;
            const isReject = !response;
            const isTransactionResponse = txnResponse.hash && !isReject;

            if (isReject) {
              const userRejectError = new Error('Rejected by user.');
              throw userRejectError;
            }

            if (isTransactionResponse) {
              await waitForTransactionReceipt(txnResponse.hash, walletProvider);

              leveragePositionStatus$.next({
                pending: false,
                statusType,
                success: true,
                request,
                response: txnResponse,
                txHash: txnResponse.hash,
              });

              if (statusType === 'approve' || statusType === 'permit') {
                notification$.next({
                  notificationId,
                  notificationType: 'approval-success',
                  timestamp: Date.now(),
                });
              }
            } else {
              leveragePositionStatus$.next({ pending: false, request, statusType, success: true, signature });

              if (statusType === 'approve' || statusType === 'permit') {
                notification$.next({
                  notificationId,
                  notificationType: 'approval-success',
                  timestamp: Date.now(),
                });
              }
            }

            leveragePositionStepsStatus$.next({
              request,
              result: null,
              generator,
              pending: true,
            });

            const nextStep = await generator.next(!isTransactionResponse ? signature : undefined);
            leveragePositionStepsStatus$.next({
              request,
              result: nextStep.value ?? null,
              generator,
              pending: false,
            });

            emitAppEvent({
              eventType: statusType,
              metadata: {
                collateralToken: request?.collateralToken,
                underlyingCollateralToken: request?.underlyingCollateralToken,
                tokenAmount: request?.collateralChange,
              },
              timestamp: Date.now(),
              txnHash: txnResponse.hash,
            });
          } catch (error) {
            console.error(`useLeverage (error) - Failed to execute ${statusType}!`, error);
            leveragePositionStatus$.next({ pending: false, request, statusType, error: error as Error });

            if (statusType === 'approve' || statusType === 'permit') {
              notification$.next({
                notificationId,
                notificationType: 'approval-error',
                timestamp: Date.now(),
              });
            }
          }
        };
      }

      return null;
    },
  ),
);

const requestLeveragePositionStep$ = walletSigner$.pipe(
  map<Nullable<JsonRpcSigner>, RequestLeveragePositionStepFunc>(signer => (request: LeveragePositionStepsRequest) => {
    if (!signer) {
      return;
    }
    const userPositionMapKey = `${signer.address}-${request.underlyingCollateralToken}`;

    let userPosition = userPositionMap[userPositionMapKey];

    if (!userPosition) {
      userPosition = new UserPosition<SupportedUnderlyingCollateralToken>(signer, request.underlyingCollateralToken);
      userPositionMap[userPositionMapKey] = userPosition;
    }

    setLeveragePositionStepsRequest(request);
  }),
);

const tokenMapsLoaded$ = combineLatest([
  leveragePositionStepsRequest$,
  leverageTokenWhitelists$,
  leverageTokenAllowances$,
]).pipe(
  map(([request, leverageTokenWhitelistMap, leverageTokenAllowanceMap]) => {
    const { collateralToken } = request;
    const isDelegateWhitelisted = leverageTokenWhitelistMap[collateralToken];
    const collateralTokenAllowance = leverageTokenAllowanceMap[collateralToken];

    return isDelegateWhitelisted !== null && Boolean(collateralTokenAllowance);
  }),
  distinctUntilChanged(),
);
const distinctRequest$ = leveragePositionStepsRequest$.pipe(
  distinctUntilChanged(
    (prev, current) =>
      prev.collateralToken === current.collateralToken &&
      prev.underlyingCollateralToken === current.underlyingCollateralToken &&
      prev.collateralChange.equals(current.collateralChange) &&
      prev.leverage.equals(current.leverage) &&
      prev.slippage.equals(current.slippage) &&
      prev.isClosePosition === current.isClosePosition,
  ),
);
const stream$ = combineLatest([distinctRequest$, tokenMapsLoaded$]).pipe(
  filter(([, tokenMapsLoaded]) => tokenMapsLoaded), // only to process steps when all maps are loaded
  withLatestFrom(
    leverageTokenWhitelists$,
    leverageTokenAllowances$,
    position$,
    collateralConversionRates$,
    collateralBorrowingRates$,
    tokenPrices$,
    walletSigner$,
  ),
  concatMap(
    ([
      [request],
      leverageTokenWhitelistMap,
      leverageTokenAllowanceMap,
      position,
      collateralConversionRates,
      collateralBorrowingRates,
      tokenPrices,
      walletSigner,
    ]) => {
      const { underlyingCollateralToken, collateralToken, collateralChange, leverage, slippage, isClosePosition } =
        request;

      if (!walletSigner) {
        return of({
          request,
          result: null,
          generator: null,
          error: 'Wallet signer is not defined!',
        } as LeveragePositionStepsResponse);
      }

      const isDelegateWhitelisted = leverageTokenWhitelistMap[collateralToken] ?? undefined;
      const collateralTokenAllowance = leverageTokenAllowanceMap[collateralToken] ?? undefined;
      const underlyingRate = collateralConversionRates[collateralToken] ?? undefined;
      const currentDebt = position?.debtBalance ?? undefined;
      const currentCollateral = position?.collateralBalance ?? undefined;
      const netBalance = position?.netBalance ?? undefined;
      const borrowRate = collateralBorrowingRates[collateralToken] ?? undefined;
      const underlyingCollateralPrice = tokenPrices[underlyingCollateralToken] ?? undefined;

      const userPositionMapKey = `${walletSigner.address}-${request.underlyingCollateralToken}`;

      try {
        const userPosition = userPositionMap[userPositionMapKey] as UserPosition<SupportedUnderlyingCollateralToken>;
        const actualCollateralChange = isClosePosition ? Decimal.ZERO : collateralChange;
        //Setting leverage to 1 will close leverage position
        const actualLeverage = isClosePosition ? Decimal.ONE : leverage;

        leveragePositionStepsStatus$.next({ pending: true, request, result: null, generator: null });

        const steps = userPosition.getLeverageSteps(
          netBalance ?? Decimal.ZERO,
          actualCollateralChange,
          actualLeverage,
          slippage,
          {
            collateralToken,
            isDelegateWhitelisted,
            currentCollateral,
            currentDebt,
            collateralTokenAllowance,
            borrowRate,
            underlyingCollateralPrice,
            underlyingRate,
            gasLimitMultiplier: GAS_LIMIT_MULTIPLIER,
          },
        );
        const nextStep$ = from(steps.next());

        return nextStep$.pipe(
          map(nextStep => {
            if (nextStep.value) {
              return {
                request,
                result: nextStep.value,
                generator: steps,
              } as unknown as LeveragePositionStepsResponse;
            }

            return {
              request,
              result: null,
              generator: steps,
            } as unknown as LeveragePositionStepsResponse;
          }),
          catchError(error => {
            console.error(
              `useLeveragePositionSteps (catchError) - failed to get leverage position steps for ${underlyingCollateralToken}!`,
              error,
            );
            return of({
              request,
              result: null,
              generator: null,
              error,
            } as LeveragePositionStepsResponse);
          }),
        );
      } catch (error) {
        console.error(
          `useLeveragePositionSteps (catch) - failed to get leverage position steps for ${underlyingCollateralToken}!`,
          error,
        );
        return of({
          request,
          result: null,
          generator: null,
          error,
        } as LeveragePositionStepsResponse);
      }
    },
  ),
  tap<LeveragePositionStepsResponse>(response => {
    leveragePositionStepsStatus$.next({ ...response, pending: false });
  }),
);

const [leveragePosition] = bind<Nullable<LeveragePositionFunc>>(leveragePosition$, null);
const [requestLeveragePositionStep] = bind<Nullable<RequestLeveragePositionStepFunc>>(
  requestLeveragePositionStep$,
  null,
);
const [leveragePositionStatus] = bind<LeveragePositionStatus>(leveragePositionStatus$, DEFAULT_VALUE);
const [leveragePositionStepsStatus] = bind<LeveragePositionStepsStatus>(leveragePositionStepsStatus$, DEFAULT_STEPS);

export const useLeverage = (): {
  leveragePositionStatus: LeveragePositionStatus;
  leveragePositionStepsStatus: LeveragePositionStepsStatus;
  leveragePosition: Nullable<LeveragePositionFunc>;
  requestLeveragePositionStep: Nullable<RequestLeveragePositionStepFunc>;
} => ({
  leveragePositionStatus: leveragePositionStatus(),
  leveragePositionStepsStatus: leveragePositionStepsStatus(),
  leveragePosition: leveragePosition(),
  requestLeveragePositionStep: requestLeveragePositionStep(),
});

let subscriptions: Subscription[];

export const subscribeLeverageStatus = (): void => {
  unsubscribeLeverageStatus();
  subscriptions = [stream$.subscribe()];
};
export const unsubscribeLeverageStatus = (): void => subscriptions?.forEach(subscription => subscription.unsubscribe());
export const resetLeverageStatus = (): void => {
  leveragePositionStatus$.next(DEFAULT_VALUE);
};
