import { v4 as uuid } from 'uuid';
import { ERC20PermitSignatureStruct, ManagePositionStep, R_TOKEN, UserPosition } from '@raft-fi/sdk';
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
import { NUMBER_OF_CONFIRMATIONS_FOR_TX, SUPPORTED_TOKENS, SUPPORTED_UNDERLYING_TOKENS } from '../constants';
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

// TODO: dummy func for now
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
async function* getLeverageSteps(_collateralChange: Decimal, _leverage: Decimal, _options: any) {
  yield {
    type: {
      name: 'approve',
    },
    stepNumber: 1,
    numberOfSteps: 2,
    action: async () => ({} as TransactionResponse),
  } as LeveragePositionStep;

  return {
    type: {
      name: 'manage',
    },
    stepNumber: 2,
    numberOfSteps: 2,
    action: async () => ({} as TransactionResponse),
  } as LeveragePositionStep;
}

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
const GAS_LIMIT_MULTIPLIER = new Decimal(2);

// TODO: provided by SDK
type LeveragePositionStep = ManagePositionStep;
type UserPositionMap = TokenGenericMap<
  SupportedUnderlyingCollateralToken,
  Nullable<UserPosition<SupportedUnderlyingCollateralToken>>
>;
type SignatureMap = TokenGenericMap<SupportedToken, Nullable<ERC20PermitSignatureStruct>>;
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
const signatureMap: SignatureMap = getNullTokenMap<SupportedToken>(SUPPORTED_TOKENS);

interface LeveragePositionStepsRequest {
  underlyingCollateralToken: SupportedUnderlyingCollateralToken;
  collateralToken: SupportedCollateralToken;
  collateralChange: Decimal;
  leverage: Decimal;
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
          // TODO: when SDK provide steps type we dont need this
          const statusType = result.type.name === 'manage' ? 'leverage' : result.type.name;

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
              const transactionReceipt = await walletProvider.waitForTransaction(
                txnResponse.hash,
                NUMBER_OF_CONFIRMATIONS_FOR_TX,
              );

              if (!transactionReceipt) {
                const receiptFetchFailed = new Error('Failed to fetch borrow transaction receipt!');
                throw receiptFetchFailed;
              }

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
              } else if (statusType === 'leverage') {
                // reset signature map after txn success
                SUPPORTED_TOKENS.forEach(token => (signatureMap[token] = null));
              }
            } else {
              leveragePositionStatus$.next({ pending: false, request, statusType, success: true, signature });

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

    let userPosition = userPositionMap[request.underlyingCollateralToken];

    if (!userPosition) {
      userPosition = new UserPosition<SupportedUnderlyingCollateralToken>(signer, request.underlyingCollateralToken);
      userPositionMap[request.underlyingCollateralToken] = userPosition;
    }

    setLeveragePositionStepsRequest(request);
  }),
);

const tokenMapsLoaded$ = combineLatest([leveragePositionStepsRequest$, tokenWhitelists$, tokenAllowances$]).pipe(
  map(([request, tokenWhitelistMap, tokenAllowanceMap]) => {
    const { collateralToken } = request;
    const isDelegateWhitelisted = tokenWhitelistMap[collateralToken];
    const collateralTokenAllowance = tokenAllowanceMap[collateralToken];
    const rTokenAllowance = tokenAllowanceMap[R_TOKEN];

    return isDelegateWhitelisted !== null && Boolean(collateralTokenAllowance) && Boolean(rTokenAllowance);
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
      prev.isClosePosition === current.isClosePosition,
  ),
);
const stream$ = combineLatest([distinctRequest$, tokenMapsLoaded$]).pipe(
  filter(([, tokenMapsLoaded]) => tokenMapsLoaded), // only to process steps when all maps are loaded
  withLatestFrom(tokenWhitelists$, tokenAllowances$),
  concatMap(([[request], tokenWhitelistMap, tokenAllowanceMap]) => {
    const { underlyingCollateralToken, collateralToken, collateralChange, leverage, isClosePosition } = request;

    const isDelegateWhitelisted = tokenWhitelistMap[collateralToken] ?? undefined;
    const collateralTokenAllowance = tokenAllowanceMap[collateralToken] ?? undefined;
    const collateralPermitSignature = isSignatureValid(signatureMap[collateralToken])
      ? (signatureMap[collateralToken] as ERC20PermitSignatureStruct)
      : undefined;

    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const userPosition = userPositionMap[
        underlyingCollateralToken
      ] as UserPosition<SupportedUnderlyingCollateralToken>;
      const actualCollateralChange = isClosePosition ? Decimal.ZERO : collateralChange;

      leveragePositionStepsStatus$.next({ pending: true, request, result: null, generator: null });

      // TODO: dummy code for now
      const steps = getLeverageSteps(actualCollateralChange, leverage, {
        collateralToken,
        isDelegateWhitelisted,
        collateralTokenAllowance,
        collateralPermitSignature,
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
  }),
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
