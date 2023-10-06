import { v4 as uuid } from 'uuid';
import { bind } from '@react-rxjs/core';
import { createSignal } from '@react-rxjs/utils';
import { Decimal } from '@tempusfinance/decimal';
import { StakeBptStep, StakeBptStepType } from '@raft-fi/sdk';
import { BrowserProvider, JsonRpcSigner, TransactionResponse } from 'ethers';
import {
  BehaviorSubject,
  withLatestFrom,
  map,
  concatMap,
  Subscription,
  tap,
  combineLatest,
  distinctUntilChanged,
} from 'rxjs';
import { Nullable } from '../interfaces';
import { emitAppEvent } from './useAppEvent';
import { notification$ } from './useNotification';
import { wallet$ } from './useWallet';
import { walletSigner$ } from './useWalletSigner';
import { raftToken$ } from './useRaftToken';
import { waitForTransactionReceipt } from '../utils';

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

interface StakeBptForVeRaftStepsRequest {
  bptAmount: Decimal;
  unlockTime: Date;
}

type StakeBptForVeRaftStepsGenerator = AsyncGenerator<StakeBptStep, void, void>;
type RequestStakeBptForVeRaftStepFunc = (request: StakeBptForVeRaftStepsRequest) => void;
type StakeBptForVeRaftFunc = () => void;

interface StakeBptForVeRaftStatus {
  pending: boolean;
  success?: boolean;
  statusType: Nullable<StakeBptStepType>;
  request: Nullable<StakeBptForVeRaftStepsRequest>;
  response?: TransactionResponse;
  txHash?: string;
  error?: Error;
}

interface StakeBptForVeRaftStepsStatus {
  pending: boolean;
  request: Nullable<StakeBptForVeRaftStepsRequest>;
  result: Nullable<StakeBptStep>;
  generator: Nullable<StakeBptForVeRaftStepsGenerator>;
  error?: Error;
}

interface StakeBptForVeRaftStepsResponse {
  request: StakeBptForVeRaftStepsRequest;
  result: Nullable<StakeBptStep>;
  generator: Nullable<StakeBptForVeRaftStepsGenerator>;
}

const [stakeBptForVeRaftStepsRequest$, setStakeBptForVeRaftStepsRequest] =
  createSignal<StakeBptForVeRaftStepsRequest>();
const stakeBptForVeRaftStepsStatus$ = new BehaviorSubject<StakeBptForVeRaftStepsStatus>(DEFAULT_STEPS);
const stakeBptForVeRaftStatus$ = new BehaviorSubject<StakeBptForVeRaftStatus>(DEFAULT_VALUE);

const stakeBptForVeRaft$ = stakeBptForVeRaftStepsStatus$.pipe(
  withLatestFrom(wallet$),
  map<[StakeBptForVeRaftStepsStatus, Nullable<BrowserProvider>], Nullable<StakeBptForVeRaftFunc>>(
    ([status, walletProvider]) => {
      const { pending, request, result, generator, error } = status;

      if (!pending && !error && result && generator && walletProvider) {
        return async () => {
          const notificationId = uuid();
          const statusType = result.type;

          try {
            stakeBptForVeRaftStatus$.next({ pending: true, request, statusType });

            if (statusType === 'approve') {
              notification$.next({
                notificationId,
                notificationType: 'approval-pending',
                timestamp: Date.now(),
              });
            }

            const response = await result.action();
            const isReject = !response;

            if (isReject) {
              const userRejectError = new Error('Rejected by user.');
              throw userRejectError;
            }

            const transactionReceipt = await waitForTransactionReceipt(response.hash, walletProvider);

            if (!transactionReceipt) {
              const receiptFetchFailed = new Error('Failed to fetch borrow transaction receipt!');
              throw receiptFetchFailed;
            }

            if (statusType === 'approve') {
              notification$.next({
                notificationId,
                notificationType: 'approval-success',
                timestamp: Date.now(),
              });
            }

            stakeBptForVeRaftStepsStatus$.next({
              request,
              result: null,
              generator,
              pending: true,
            });

            const nextStep = await generator.next();
            stakeBptForVeRaftStepsStatus$.next({
              request,
              result: nextStep.value ?? null,
              generator,
              pending: false,
            });

            stakeBptForVeRaftStatus$.next({
              pending: false,
              statusType,
              success: nextStep.done,
              request,
              response,
              txHash: response.hash,
            });

            emitAppEvent({
              eventType: statusType,
              timestamp: Date.now(),
              txnHash: response.hash,
            });
          } catch (error) {
            console.error(`useStakeBptForVeRaft (error) - Failed to execute ${statusType}!`, error);
            stakeBptForVeRaftStatus$.next({ pending: false, request, statusType, error: error as Error });

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
    },
  ),
);

const requestStakeBptForVeRaftStep$ = walletSigner$.pipe(
  map<Nullable<JsonRpcSigner>, RequestStakeBptForVeRaftStepFunc>(signer => (request: StakeBptForVeRaftStepsRequest) => {
    if (!signer) {
      return;
    }

    setStakeBptForVeRaftStepsRequest(request);
  }),
);

const distinctRequest$ = stakeBptForVeRaftStepsRequest$.pipe(
  distinctUntilChanged(
    (prev, current) => prev.bptAmount === current.bptAmount && prev.unlockTime === current.unlockTime,
  ),
);
const stream$ = combineLatest([distinctRequest$, raftToken$, walletSigner$]).pipe(
  concatMap(async ([request, raftToken, walletSigner]) => {
    const { bptAmount, unlockTime } = request;

    if (!raftToken || !walletSigner) {
      return {
        request,
        result: null,
        generator: null,
      } as StakeBptForVeRaftStepsResponse;
    }

    try {
      stakeBptForVeRaftStepsStatus$.next({ pending: true, request, result: null, generator: null });

      const bptAllowance = await raftToken.getUserBptAllowance();

      const steps = raftToken.getStakeBptSteps(bptAmount, unlockTime, walletSigner, { bptAllowance });
      const nextStep = await steps.next();

      if (nextStep.value) {
        return {
          request,
          result: nextStep.value,
          generator: steps,
        } as StakeBptForVeRaftStepsResponse;
      }

      return {
        request,
        result: null,
        generator: steps,
      } as StakeBptForVeRaftStepsResponse;
    } catch (error) {
      console.error('useStakeBptForVeRaftSteps (catch) - failed to get staking steps!', error);
      return {
        request,
        result: null,
        generator: null,
        error,
      } as StakeBptForVeRaftStepsResponse;
    }
  }),
  tap<StakeBptForVeRaftStepsResponse>(response => {
    stakeBptForVeRaftStepsStatus$.next({ ...response, pending: false });
  }),
);

const [stakeBptForVeRaft] = bind<Nullable<StakeBptForVeRaftFunc>>(stakeBptForVeRaft$, null);
const [requestStakeBptForVeRaftStep] = bind<Nullable<RequestStakeBptForVeRaftStepFunc>>(
  requestStakeBptForVeRaftStep$,
  null,
);
const [stakeBptForVeRaftStatus] = bind<StakeBptForVeRaftStatus>(stakeBptForVeRaftStatus$, DEFAULT_VALUE);
const [stakeBptForVeRaftStepsStatus] = bind<StakeBptForVeRaftStepsStatus>(stakeBptForVeRaftStepsStatus$, DEFAULT_STEPS);

export const useStakeBptForVeRaft = (): {
  stakeBptForVeRaftStatus: StakeBptForVeRaftStatus;
  stakeBptForVeRaftStepsStatus: StakeBptForVeRaftStepsStatus;
  stakeBptForVeRaft: Nullable<StakeBptForVeRaftFunc>;
  requestStakeBptForVeRaftStep: Nullable<RequestStakeBptForVeRaftStepFunc>;
} => ({
  stakeBptForVeRaftStatus: stakeBptForVeRaftStatus(),
  stakeBptForVeRaftStepsStatus: stakeBptForVeRaftStepsStatus(),
  stakeBptForVeRaft: stakeBptForVeRaft(),
  requestStakeBptForVeRaftStep: requestStakeBptForVeRaftStep(),
});

let subscriptions: Subscription[];

export const subscribeStakeBptForVeRaftStatus = (): void => {
  unsubscribeStakeBptForVeRaftStatus();
  subscriptions = [stream$.subscribe()];
};
export const unsubscribeStakeBptForVeRaftStatus = (): void =>
  subscriptions?.forEach(subscription => subscription.unsubscribe());
export const resetStakeBptForVeRaftStatus = (): void => {
  stakeBptForVeRaftStatus$.next(DEFAULT_VALUE);
};
