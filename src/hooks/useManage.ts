import { v4 as uuid } from 'uuid';
import { ERC20PermitSignatureStruct, R_TOKEN, UserPosition, ManagePositionStep } from '@raft-fi/sdk';
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
import {
  GAS_LIMIT_MULTIPLIER,
  NUMBER_OF_CONFIRMATIONS_FOR_TX,
  SUPPORTED_TOKENS,
  SUPPORTED_UNDERLYING_TOKENS,
} from '../constants';
import {
  Nullable,
  SupportedCollateralToken,
  SupportedToken,
  SupportedUnderlyingCollateralToken,
  TokenGenericMap,
} from '../interfaces';
import { emitAppEvent } from './useAppEvent';
import { notification$ } from './useNotification';
import { tokenAllowances$ } from './useTokenAllowances';
import { tokenWhitelists$ } from './useTokenWhitelists';
import { wallet$ } from './useWallet';
import { walletSigner$ } from './useWalletSigner';
import { getNullTokenMap, isSignatureValid } from '../utils';

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
type SignatureMap = TokenGenericMap<SupportedToken, Nullable<ERC20PermitSignatureStruct>>;
type ManagePositionStepsGenerator = AsyncGenerator<ManagePositionStep, void, ERC20PermitSignatureStruct | undefined>;
type ManagePositionFunc = () => void;
type RequestManagePositionStepFunc = (request: ManagePositionStepsRequest) => void;
type ManagePositionStatusType = 'whitelist' | 'approve' | 'permit' | 'manage';

const userPositionMap: UserPositionMap =
  getNullTokenMap<SupportedUnderlyingCollateralToken>(SUPPORTED_UNDERLYING_TOKENS);
const signatureMap: SignatureMap = getNullTokenMap<SupportedToken>(SUPPORTED_TOKENS);

interface ManagePositionStepsRequest {
  underlyingCollateralToken: SupportedUnderlyingCollateralToken;
  collateralToken: SupportedCollateralToken;
  collateralChange: Decimal;
  debtChange: Decimal;
  isClosePosition?: boolean;
}

interface ManagePositionStatus {
  pending: boolean;
  success?: boolean;
  statusType: Nullable<ManagePositionStatusType>;
  request: Nullable<ManagePositionStepsRequest>;
  response?: TransactionResponse;
  signature?: ERC20PermitSignatureStruct;
  txHash?: string;
  error?: Error;
}

interface ManagePositionStepsStatus {
  pending: boolean;
  request: Nullable<ManagePositionStepsRequest>;
  result: Nullable<ManagePositionStep>;
  generator: Nullable<ManagePositionStepsGenerator>;
  error?: Error;
}

interface ManagePositionStepsResponse {
  request: ManagePositionStepsRequest;
  result: Nullable<ManagePositionStep>;
  generator: Nullable<ManagePositionStepsGenerator>;
}

const [managePositionStepsRequest$, setManagePositionStepsRequest] = createSignal<ManagePositionStepsRequest>();
const managePositionStepsStatus$ = new BehaviorSubject<ManagePositionStepsStatus>(DEFAULT_STEPS);
const managePositionStatus$ = new BehaviorSubject<ManagePositionStatus>(DEFAULT_VALUE);

const managePosition$ = managePositionStepsStatus$.pipe(
  withLatestFrom(wallet$),
  map<[ManagePositionStepsStatus, Nullable<BrowserProvider>], Nullable<ManagePositionFunc>>(
    ([status, walletProvider]) => {
      const { pending, request, result, generator, error } = status;

      if (!pending && !error && result && generator && walletProvider) {
        return async () => {
          const notificationId = uuid();
          const statusType = result.type.name;

          try {
            managePositionStatus$.next({ pending: true, request, statusType });

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
              const transactionReceipt = await walletProvider.waitForTransaction(
                txnResponse.hash,
                NUMBER_OF_CONFIRMATIONS_FOR_TX,
              );

              if (!transactionReceipt) {
                const receiptFetchFailed = new Error('Failed to fetch borrow transaction receipt!');
                throw receiptFetchFailed;
              }

              managePositionStatus$.next({
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
              } else if (statusType === 'manage') {
                // reset signature map after txn success
                SUPPORTED_TOKENS.forEach(token => (signatureMap[token] = null));
              }
            } else {
              managePositionStatus$.next({ pending: false, request, statusType, success: true, signature });

              if (result.type.token && ([...SUPPORTED_TOKENS] as string[]).includes(result.type.token)) {
                signatureMap[result.type.token] = signature;
              }

              if (statusType === 'approve' || statusType === 'permit') {
                notification$.next({
                  notificationId,
                  notificationType: 'approval-success',
                  timestamp: Date.now(),
                });
              }
            }

            managePositionStepsStatus$.next({
              request,
              result: null,
              generator,
              pending: true,
            });

            const nextStep = await generator.next(!isTransactionResponse ? signature : undefined);
            managePositionStepsStatus$.next({
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
            console.error(`useManage (error) - Failed to execute ${statusType}!`, error);
            managePositionStatus$.next({ pending: false, request, statusType, error: error as Error });

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

const requestManagePositionStep$ = walletSigner$.pipe(
  map(signer => (request: ManagePositionStepsRequest) => {
    if (!signer) {
      return;
    }

    const userPositionMapKey = `${signer.address}-${request.underlyingCollateralToken}`;

    let userPosition = userPositionMap[userPositionMapKey];

    if (!userPosition) {
      userPosition = new UserPosition<SupportedUnderlyingCollateralToken>(signer, request.underlyingCollateralToken);
      userPositionMap[userPositionMapKey] = userPosition;
    }

    setManagePositionStepsRequest(request);
  }),
);

const tokenMapsLoaded$ = combineLatest([managePositionStepsRequest$, tokenWhitelists$, tokenAllowances$]).pipe(
  map(([request, tokenWhitelistMap, tokenAllowanceMap]) => {
    const { collateralToken } = request;
    const isDelegateWhitelisted = tokenWhitelistMap[collateralToken];
    const collateralTokenAllowance = tokenAllowanceMap[collateralToken];
    const rTokenAllowance = tokenAllowanceMap[R_TOKEN];

    return isDelegateWhitelisted !== null && Boolean(collateralTokenAllowance) && Boolean(rTokenAllowance);
  }),
  distinctUntilChanged(),
);
const distinctRequest$ = managePositionStepsRequest$.pipe(
  distinctUntilChanged(
    (prev, current) =>
      prev.collateralToken === current.collateralToken &&
      prev.underlyingCollateralToken === current.underlyingCollateralToken &&
      prev.collateralChange.equals(current.collateralChange) &&
      prev.debtChange.equals(current.debtChange) &&
      prev.isClosePosition === current.isClosePosition,
  ),
);
const stream$ = combineLatest([distinctRequest$, tokenMapsLoaded$]).pipe(
  filter(([, tokenMapsLoaded]) => tokenMapsLoaded), // only to process steps when all maps are loaded
  withLatestFrom(tokenWhitelists$, tokenAllowances$, walletSigner$),
  concatMap(([[request], tokenWhitelistMap, tokenAllowanceMap, walletSigner]) => {
    const { underlyingCollateralToken, collateralToken, collateralChange, debtChange, isClosePosition } = request;

    if (!walletSigner) {
      return of({
        request,
        result: null,
        generator: null,
        error: 'Wallet signer is not defined!',
      } as ManagePositionStepsResponse);
    }

    const isDelegateWhitelisted = tokenWhitelistMap[collateralToken] ?? undefined;
    const collateralTokenAllowance = tokenAllowanceMap[collateralToken] ?? undefined;
    const rTokenAllowance = tokenAllowanceMap[R_TOKEN] ?? undefined;
    const collateralPermitSignature = isSignatureValid(signatureMap[collateralToken])
      ? (signatureMap[collateralToken] as ERC20PermitSignatureStruct)
      : undefined;
    const rPermitSignature = isSignatureValid(signatureMap[R_TOKEN])
      ? (signatureMap[R_TOKEN] as ERC20PermitSignatureStruct)
      : undefined;

    if (collateralChange.isZero() && debtChange.isZero()) {
      return of({
        request,
        result: null,
        generator: null,
      } as ManagePositionStepsResponse);
    }

    const userPositionMapKey = `${walletSigner.address}-${request.underlyingCollateralToken}`;

    try {
      const userPosition = userPositionMap[userPositionMapKey] as UserPosition<SupportedUnderlyingCollateralToken>;
      const actualCollateralChange = isClosePosition ? Decimal.ZERO : collateralChange;
      const actualDebtChange = isClosePosition ? Decimal.MAX_DECIMAL.mul(-1) : debtChange;

      managePositionStepsStatus$.next({ pending: true, request, result: null, generator: null });

      const steps = userPosition.getManageSteps(actualCollateralChange, actualDebtChange, {
        collateralToken,
        isDelegateWhitelisted,
        collateralTokenAllowance,
        rTokenAllowance,
        collateralPermitSignature,
        rPermitSignature,
        gasLimitMultiplier: GAS_LIMIT_MULTIPLIER,
      });
      const nextStep$ = from(steps.next());

      return nextStep$.pipe(
        map(nextStep => {
          if (nextStep.value) {
            return {
              request,
              result: nextStep.value,
              generator: steps,
            } as ManagePositionStepsResponse;
          }

          return {
            request,
            result: null,
            generator: steps,
          } as ManagePositionStepsResponse;
        }),
        catchError(error => {
          console.error(
            `useManagePositionSteps (catchError) - failed to get manage position steps for ${underlyingCollateralToken}!`,
            error,
          );
          return of({
            request,
            result: null,
            generator: null,
            error,
          } as ManagePositionStepsResponse);
        }),
      );
    } catch (error) {
      console.error(
        `useManagePositionSteps (catch) - failed to get manage position steps for ${underlyingCollateralToken}!`,
        error,
      );
      return of({
        request,
        result: null,
        generator: null,
        error,
      } as ManagePositionStepsResponse);
    }
  }),
  tap<ManagePositionStepsResponse>(response => {
    managePositionStepsStatus$.next({ ...response, pending: false });
  }),
);

const [managePosition] = bind<Nullable<ManagePositionFunc>>(managePosition$, null);
const [requestManagePositionStep] = bind<Nullable<RequestManagePositionStepFunc>>(requestManagePositionStep$, null);
const [managePositionStatus] = bind<ManagePositionStatus>(managePositionStatus$, DEFAULT_VALUE);
const [managePositionStepsStatus] = bind<ManagePositionStepsStatus>(managePositionStepsStatus$, DEFAULT_STEPS);

export const useManage = (): {
  managePositionStatus: ManagePositionStatus;
  managePositionStepsStatus: ManagePositionStepsStatus;
  managePosition: Nullable<ManagePositionFunc>;
  requestManagePositionStep: Nullable<RequestManagePositionStepFunc>;
} => ({
  managePositionStatus: managePositionStatus(),
  managePositionStepsStatus: managePositionStepsStatus(),
  managePosition: managePosition(),
  requestManagePositionStep: requestManagePositionStep(),
});

let subscriptions: Subscription[];

export const subscribeManageStatus = (): void => {
  unsubscribeManageStatus();
  subscriptions = [stream$.subscribe()];
};
export const unsubscribeManageStatus = (): void => subscriptions?.forEach(subscription => subscription.unsubscribe());
export const resetManageStatus = (): void => {
  managePositionStatus$.next(DEFAULT_VALUE);
};
