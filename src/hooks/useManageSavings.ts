import { v4 as uuid } from 'uuid';
import {
  ERC20PermitSignatureStruct,
  RaftConfig,
  SavingsStep,
  SupportedSavingsNetwork,
  UserSavings,
} from '@raft-fi/sdk';
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
import { GAS_LIMIT_MULTIPLIER, NUMBER_OF_CONFIRMATIONS_FOR_TX } from '../constants';
import { Nullable } from '../interfaces';
import { emitAppEvent } from './useAppEvent';
import { notification$ } from './useNotification';
import { wallet$, walletLabel$ } from './useWallet';
import { walletSigner$ } from './useWalletSigner';
import { isSignatureValid } from '../utils';
import { currentSavingsNetwork$ } from './useCurrentSavingsNetwork';
import { savingsTokenAllowance$ } from './useSavingsTokenAllowance';

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

type ManageSavingsStepsGenerator = AsyncGenerator<SavingsStep, void, ERC20PermitSignatureStruct | undefined>;
type ManageSavingsFunc = () => void;
type RequestManageSavingsStepFunc = (request: ManageSavingsStepsRequest) => void;
type ManageSavingsStatusType = 'approve' | 'permit' | 'manageSavings';

let rSignature: ERC20PermitSignatureStruct | undefined;
let userSavings: Nullable<UserSavings> = null;

interface ManageSavingsStepsRequest {
  amount: Decimal;
  network: SupportedSavingsNetwork;
}

interface ManageSavingsStatus {
  pending: boolean;
  success?: boolean;
  statusType: Nullable<ManageSavingsStatusType>;
  request: Nullable<ManageSavingsStepsRequest>;
  response?: TransactionResponse;
  signature?: ERC20PermitSignatureStruct;
  txHash?: string;
  error?: Error;
}

interface ManageSavingsStepsStatus {
  pending: boolean;
  request: Nullable<ManageSavingsStepsRequest>;
  result: Nullable<SavingsStep>;
  generator: Nullable<ManageSavingsStepsGenerator>;
  error?: Error;
}

interface ManageSavingsStepsResponse {
  request: ManageSavingsStepsRequest;
  result: Nullable<SavingsStep>;
  generator: Nullable<ManageSavingsStepsGenerator>;
}

const [manageSavingsStepsRequest$, setManageSavingsStepsRequest] = createSignal<ManageSavingsStepsRequest>();
const manageSavingsStepsStatus$ = new BehaviorSubject<ManageSavingsStepsStatus>(DEFAULT_STEPS);
const manageSavingsStatus$ = new BehaviorSubject<ManageSavingsStatus>(DEFAULT_VALUE);

const manageSavings$ = manageSavingsStepsStatus$.pipe(
  withLatestFrom(wallet$),
  map<[ManageSavingsStepsStatus, Nullable<BrowserProvider>], Nullable<ManageSavingsFunc>>(
    ([status, walletProvider]) => {
      const { pending, request, result, generator, error } = status;

      if (!pending && !error && result && generator && walletProvider) {
        return async () => {
          const notificationId = uuid();
          const statusType = result.type.name;

          try {
            manageSavingsStatus$.next({ pending: true, request, statusType });

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

              manageSavingsStatus$.next({
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
              } else if (statusType === 'manageSavings') {
                // reset signature after txn success
                rSignature = undefined;
              }
            } else {
              manageSavingsStatus$.next({ pending: false, request, statusType, success: true, signature });

              rSignature = signature;

              if (statusType === 'approve' || statusType === 'permit') {
                notification$.next({
                  notificationId,
                  notificationType: 'approval-success',
                  timestamp: Date.now(),
                });
              }
            }

            manageSavingsStepsStatus$.next({
              request,
              result: null,
              generator,
              pending: true,
            });

            const nextStep = await generator.next(!isTransactionResponse ? signature : undefined);
            manageSavingsStepsStatus$.next({
              request,
              result: nextStep.value ?? null,
              generator,
              pending: false,
            });

            emitAppEvent({
              eventType: statusType,
              metadata: {
                tokenAmount: request?.amount,
              },
              timestamp: Date.now(),
              txnHash: txnResponse.hash,
            });
          } catch (error) {
            console.error(`useManage (error) - Failed to execute ${statusType}!`, error);
            manageSavingsStatus$.next({ pending: false, request, statusType, error: error as Error });

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

const requestManageSavingsStep$ = combineLatest([walletSigner$, currentSavingsNetwork$]).pipe(
  map<[Nullable<JsonRpcSigner>, SupportedSavingsNetwork], RequestManageSavingsStepFunc>(
    ([signer, currentSavingsNetwork]) =>
      (request: ManageSavingsStepsRequest) => {
        if (!signer) {
          return;
        }

        // TODO - This is a workaround to create savings instance for specific network - if we change network in RaftConfig globally
        // and leave it like that some other parts of app will break. We need to refactor the app to correctly handle all possible networks
        const cachedNetwork = RaftConfig.network;
        RaftConfig.setNetwork(currentSavingsNetwork);
        userSavings = new UserSavings(signer);
        RaftConfig.setNetwork(cachedNetwork);

        setManageSavingsStepsRequest(request);
      },
  ),
);

// Stream that waits for token allowances to be loaded before we can send request to SDK to get manage savings steps
const tokenAllowanceLoaded$ = combineLatest([savingsTokenAllowance$]).pipe(
  map(([savingsTokenAllowance]) => {
    return Boolean(savingsTokenAllowance);
  }),
  distinctUntilChanged(),
);

// Stream that checks if request is distinct from previous one
const distinctRequest$ = manageSavingsStepsRequest$.pipe(
  distinctUntilChanged((prev, current) => prev.amount.equals(current.amount) && prev.network === current.network),
);

const stream$ = combineLatest([distinctRequest$, tokenAllowanceLoaded$]).pipe(
  filter(([, tokenMapsLoaded]) => tokenMapsLoaded),
  withLatestFrom(savingsTokenAllowance$, walletLabel$),
  concatMap(([[request], savingsTokenAllowance]) => {
    const { amount } = request;

    const rTokenAllowance = savingsTokenAllowance ?? undefined;

    const rPermitSignature = isSignatureValid(rSignature || null) ? rSignature : undefined;

    if (amount.isZero() || !userSavings) {
      return of({
        request,
        result: null,
        generator: null,
      } as ManageSavingsStepsResponse);
    }

    try {
      manageSavingsStepsStatus$.next({ pending: true, request, result: null, generator: null });

      const steps = userSavings.getManageSavingsSteps(amount, {
        rTokenAllowance,
        rPermitSignature,
        gasLimitMultiplier: GAS_LIMIT_MULTIPLIER,
        approvalType: 'approve',
      });
      const nextStep$ = from(steps.next());

      return nextStep$.pipe(
        map(nextStep => {
          if (nextStep.value) {
            return {
              request,
              result: nextStep.value,
              generator: steps,
            } as ManageSavingsStepsResponse;
          }

          return {
            request,
            result: null,
            generator: steps,
          } as ManageSavingsStepsResponse;
        }),
        catchError(error => {
          console.error(`useManageSavingsSteps (catchError) - failed to get manage savings steps for!`, error);
          return of({
            request,
            result: null,
            generator: null,
            error,
          } as ManageSavingsStepsResponse);
        }),
      );
    } catch (error) {
      console.error(`useManageSavingsSteps (catch) - failed to get manage savings steps for!`, error);
      return of({
        request,
        result: null,
        generator: null,
        error,
      } as ManageSavingsStepsResponse);
    }
  }),
  tap<ManageSavingsStepsResponse>(response => {
    manageSavingsStepsStatus$.next({ ...response, pending: false });
  }),
);

const [manageSavings] = bind<Nullable<ManageSavingsFunc>>(manageSavings$, null);
const [requestManageSavingsStep] = bind<Nullable<RequestManageSavingsStepFunc>>(requestManageSavingsStep$, null);
const [manageSavingsStatus] = bind<ManageSavingsStatus>(manageSavingsStatus$, DEFAULT_VALUE);
const [manageSavingsStepsStatus] = bind<ManageSavingsStepsStatus>(manageSavingsStepsStatus$, DEFAULT_STEPS);

export const useManageSavings = (): {
  manageSavingsStatus: ManageSavingsStatus;
  manageSavingsStepsStatus: ManageSavingsStepsStatus;
  manageSavings: Nullable<ManageSavingsFunc>;
  requestManageSavingsStep: Nullable<RequestManageSavingsStepFunc>;
} => ({
  manageSavingsStatus: manageSavingsStatus(),
  manageSavingsStepsStatus: manageSavingsStepsStatus(),
  manageSavings: manageSavings(),
  requestManageSavingsStep: requestManageSavingsStep(),
});

let subscriptions: Subscription[];

export const subscribeManageSavingsStatus = (): void => {
  unsubscribeManageSavingsStatus();
  subscriptions = [stream$.subscribe()];
};
export const unsubscribeManageSavingsStatus = (): void =>
  subscriptions?.forEach(subscription => subscription.unsubscribe());
export const resetManageSavingsStatus = (): void => {
  manageSavingsStatus$.next(DEFAULT_VALUE);
};
