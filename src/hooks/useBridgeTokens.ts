import { v4 as uuid } from 'uuid';
import { BridgeTokensStep, Bridge, SupportedBridgeNetwork } from '@raft-fi/sdk';
import { bind } from '@react-rxjs/core';
import { createSignal } from '@react-rxjs/utils';
import { Decimal } from '@tempusfinance/decimal';
import { BrowserProvider, JsonRpcSigner, TransactionReceipt, TransactionResponse } from 'ethers';
import {
  BehaviorSubject,
  withLatestFrom,
  from,
  of,
  map,
  concatMap,
  Subscription,
  tap,
  distinctUntilChanged,
  catchError,
} from 'rxjs';
import { GAS_LIMIT_MULTIPLIER, NUMBER_OF_CONFIRMATIONS_FOR_TX } from '../constants';
import { Nullable } from '../interfaces';
import { emitAppEvent } from './useAppEvent';
import { notification$ } from './useNotification';
import { wallet$ } from './useWallet';
import { walletSigner$ } from './useWalletSigner';
import { bridgeAllowances$ } from './useBridgeAllowances';

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

type BridgeTokensGenerator = AsyncGenerator<BridgeTokensStep>;
type BridgeTokensFunc = () => void;
type RequestBridgeTokensStepFunc = (request: BridgeTokensStepsRequest) => void;
type BridgeTokensStatusType = 'approve' | 'bridgeTokens';

let bridge: Nullable<Bridge> = null;

export interface BridgeTokensStepsRequest {
  sourceChainName: SupportedBridgeNetwork;
  destinationChainName: SupportedBridgeNetwork;
  amountToBridge: Decimal;
}

interface BridgeTransactionResponse {
  txnResponse: TransactionResponse;
  txnReceipt: TransactionReceipt;
}

interface BridgeTokensStatus {
  pending: boolean;
  success?: boolean;
  statusType: Nullable<BridgeTokensStatusType>;
  request: Nullable<BridgeTokensStepsRequest>;
  response?: BridgeTransactionResponse;
  txHash?: string;
  error?: Error;
}

interface BridgeTokensStepsStatus {
  pending: boolean;
  request: Nullable<BridgeTokensStepsRequest>;
  result: Nullable<BridgeTokensStep>;
  generator: Nullable<BridgeTokensGenerator>;
  error?: Error;
}

interface BridgeTokensStepsResponse {
  request: BridgeTokensStepsRequest;
  result: Nullable<BridgeTokensStep>;
  generator: Nullable<BridgeTokensGenerator>;
}

export const [bridgeTokensStepsRequest$, setBridgeTokensStepsRequest] = createSignal<BridgeTokensStepsRequest>();
const bridgeTokensStepsStatus$ = new BehaviorSubject<BridgeTokensStepsStatus>(DEFAULT_STEPS);
export const bridgeTokensStatus$ = new BehaviorSubject<BridgeTokensStatus>(DEFAULT_VALUE);

const bridgeTokens$ = bridgeTokensStepsStatus$.pipe(
  withLatestFrom(wallet$),
  map<[BridgeTokensStepsStatus, Nullable<BrowserProvider>], Nullable<BridgeTokensFunc>>(([status, walletProvider]) => {
    const { pending, request, result, generator, error } = status;

    if (!pending && !error && result && generator && walletProvider) {
      return async () => {
        const notificationId = uuid();
        const statusType = result.type.name;

        try {
          bridgeTokensStatus$.next({ pending: true, request, statusType });

          if (statusType === 'approve') {
            notification$.next({
              notificationId,
              notificationType: 'approval-pending',
              timestamp: Date.now(),
            });
          }

          const response = await result.action();
          const txnResponse = response as TransactionResponse;
          const isReject = !response;
          const isTransactionResponse = txnResponse.hash && !isReject;

          if (isReject) {
            const userRejectError = new Error('Rejected by user.');
            throw userRejectError;
          }

          if (isTransactionResponse) {
            const txnReceipt = await walletProvider.waitForTransaction(
              txnResponse.hash,
              NUMBER_OF_CONFIRMATIONS_FOR_TX,
            );

            if (!txnReceipt) {
              const receiptFetchFailed = new Error('Failed to fetch bridge tokens step transaction receipt!');
              throw receiptFetchFailed;
            }

            bridgeTokensStatus$.next({
              pending: false,
              statusType,
              success: true,
              request,
              response: { txnResponse, txnReceipt },
              txHash: txnResponse.hash,
            });

            if (statusType === 'approve') {
              notification$.next({
                notificationId,
                notificationType: 'approval-success',
                timestamp: Date.now(),
              });
            }
          } else {
            bridgeTokensStatus$.next({ pending: false, request, statusType, success: true });

            if (statusType === 'approve') {
              notification$.next({
                notificationId,
                notificationType: 'approval-success',
                timestamp: Date.now(),
              });
            }
          }

          bridgeTokensStepsStatus$.next({
            request,
            result: null,
            generator,
            pending: true,
          });

          const nextStep = await generator.next();
          bridgeTokensStepsStatus$.next({
            request,
            result: nextStep.value ?? null,
            generator,
            pending: false,
          });

          emitAppEvent({
            eventType: statusType,
            metadata: {
              tokenAmount: request?.amountToBridge,
            },
            timestamp: Date.now(),
            txnHash: txnResponse.hash,
          });
        } catch (error) {
          console.error(`useBridgeTokens (error) - Failed to execute ${statusType}!`, error);
          bridgeTokensStatus$.next({ pending: false, request, statusType, error: error as Error });

          if (statusType === 'approve') {
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
  }),
);

const requestBridgeTokensStep$ = walletSigner$.pipe(
  map<Nullable<JsonRpcSigner>, RequestBridgeTokensStepFunc>(signer => (request: BridgeTokensStepsRequest) => {
    if (!signer) {
      return;
    }

    bridge = new Bridge(signer);

    setBridgeTokensStepsRequest(request);
  }),
);

// Stream that checks if request is distinct from previous one
const distinctRequest$ = bridgeTokensStepsRequest$.pipe(
  distinctUntilChanged(
    (prev, current) =>
      prev.amountToBridge.equals(current.amountToBridge) &&
      prev.sourceChainName === current.sourceChainName &&
      prev.destinationChainName === current.destinationChainName,
  ),
);

const stream$ = distinctRequest$.pipe(
  withLatestFrom(bridgeAllowances$),
  concatMap(([request, bridgeAllowances]) => {
    const { sourceChainName, destinationChainName, amountToBridge } = request;

    const rTokenAllowance = bridgeAllowances[sourceChainName] ?? undefined;

    if (amountToBridge.isZero() || !bridge) {
      return of({
        request,
        result: null,
        generator: null,
      } as BridgeTokensStepsResponse);
    }

    try {
      bridgeTokensStepsStatus$.next({ pending: true, request, result: null, generator: null });

      const steps = bridge.getBridgeRSteps(sourceChainName, destinationChainName, amountToBridge, {
        rTokenAllowance,
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
            } as BridgeTokensStepsResponse;
          }

          return {
            request,
            result: null,
            generator: steps,
          } as BridgeTokensStepsResponse;
        }),
        catchError(error => {
          console.error(`useBridgeTokens (catchError) - failed to get bridge tokens steps!`, error);
          return of({
            request,
            result: null,
            generator: null,
            error,
          } as BridgeTokensStepsResponse);
        }),
      );
    } catch (error) {
      console.error(`useBridgeTokens (catch) - failed to get bridge tokens steps!`, error);
      return of({
        request,
        result: null,
        generator: null,
        error,
      } as BridgeTokensStepsResponse);
    }
  }),
  tap<BridgeTokensStepsResponse>(response => {
    bridgeTokensStepsStatus$.next({ ...response, pending: false });
  }),
);

const [bridgeTokens] = bind<Nullable<BridgeTokensFunc>>(bridgeTokens$, null);
const [requestBridgeTokensStep] = bind<Nullable<RequestBridgeTokensStepFunc>>(requestBridgeTokensStep$, null);
const [bridgeTokensStatus] = bind<BridgeTokensStatus>(bridgeTokensStatus$, DEFAULT_VALUE);
const [bridgeTokensStepsStatus] = bind<BridgeTokensStepsStatus>(bridgeTokensStepsStatus$, DEFAULT_STEPS);

export const useBridgeTokens = (): {
  bridgeTokensStatus: BridgeTokensStatus;
  bridgeTokensStepsStatus: BridgeTokensStepsStatus;
  bridgeTokens: Nullable<BridgeTokensFunc>;
  requestBridgeTokensStep: Nullable<RequestBridgeTokensStepFunc>;
} => ({
  bridgeTokensStatus: bridgeTokensStatus(),
  bridgeTokensStepsStatus: bridgeTokensStepsStatus(),
  bridgeTokens: bridgeTokens(),
  requestBridgeTokensStep: requestBridgeTokensStep(),
});

let subscriptions: Subscription[];

export const subscribeBridgeTokensStatus = (): void => {
  unsubscribeBridgeTokensStatus();
  subscriptions = [stream$.subscribe()];
};
export const unsubscribeBridgeTokensStatus = (): void =>
  subscriptions?.forEach(subscription => subscription.unsubscribe());
export const resetBridgeTokensStatus = (): void => {
  bridgeTokensStatus$.next(DEFAULT_VALUE);
};
