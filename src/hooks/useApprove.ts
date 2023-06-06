import { BrowserProvider, JsonRpcSigner, ethers, ContractTransactionResponse } from 'ethers';
import { Decimal } from '@tempusfinance/decimal';
import { bind } from '@react-rxjs/core';
import { createSignal } from '@react-rxjs/utils';
import { CollateralToken, ERC20PermitSignatureStruct, UserPosition } from '@raft-fi/sdk';
import {
  concatMap,
  map,
  of,
  from,
  tap,
  BehaviorSubject,
  Subscription,
  catchError,
  combineLatest,
  Observable,
  withLatestFrom,
} from 'rxjs';
import { Nullable } from '../interfaces';
import { NUMBER_OF_CONFIRMATIONS_FOR_TX } from '../constants';
import { wallet$ } from './useWallet';
import { walletSigner$ } from './useWalletSigner';
import { emitAppEvent } from './useAppEvent';
import { notification$ } from './useNotification';

interface ApproveRequest {
  txnId: string;
  collateralToken: CollateralToken;
  collateralChange: Decimal;
  debtChange: Decimal;
  currentUserCollateral: Decimal;
  currentUserDebt: Decimal;
  closePosition?: boolean;
}

interface ApproveStatus {
  pending: boolean;
  request: ApproveRequest;
  success?: boolean;
  error?: Error;
  contractTransaction?: ethers.ContractTransactionResponse;
  collateralPermit?: ERC20PermitSignatureStruct;
  rPermit?: ERC20PermitSignatureStruct;
  txnId: string;
}

interface ApproveResponse {
  request: ApproveRequest;
  contractTransaction?: ethers.ContractTransactionResponse;
  transactionReceipt?: ethers.TransactionReceipt;
  collateralPermit?: ERC20PermitSignatureStruct;
  rPermit?: ERC20PermitSignatureStruct;
  error?: Error;
  txnId: string;
}

const [approve$, approve] = createSignal<ApproveRequest>();
const approveStatus$ = new BehaviorSubject<Nullable<ApproveStatus>>(null);

const stream$ = combineLatest([approve$]).pipe(
  withLatestFrom(wallet$, walletSigner$),
  concatMap<[[ApproveRequest], Nullable<BrowserProvider>, Nullable<JsonRpcSigner>], Observable<ApproveResponse>>(
    ([[request], walletProvider, walletSigner]) => {
      const { txnId, currentUserCollateral, currentUserDebt, collateralChange, debtChange } = request;

      try {
        if (!walletProvider || !walletSigner) {
          return of({
            request,
            error: new Error('Wallet provider/signer not defined!'),
            txnId,
          });
        }

        const userPosition = new UserPosition(walletSigner, currentUserCollateral, currentUserDebt);

        approveStatus$.next({ pending: true, txnId, request });

        const result$ = from(
          userPosition.approveManageTransaction(collateralChange, debtChange, request.collateralToken),
        );

        notification$.next({
          notificationId: txnId,
          notificationType: 'approval-pending',
          timestamp: Date.now(),
        });

        const waitForTxReceipt$ = result$.pipe(
          concatMap(result => {
            if (result instanceof ContractTransactionResponse) {
              if (result.hash) {
                return from(walletProvider.waitForTransaction(result.hash, NUMBER_OF_CONFIRMATIONS_FOR_TX)).pipe(
                  map(transactionReceipt => ({
                    contractTransaction: result,
                    transactionReceipt,
                    collateralPermit: null,
                    rPermit: null,
                  })),
                );
              } else {
                return of(null);
              }
            }
            return of({
              contractTransaction: null,
              transactionReceipt: null,
              collateralPermit: result.collateralPermit,
              rPermit: result.rPermit,
            });
          }),
        );

        return waitForTxReceipt$.pipe(
          map(
            result =>
              ({
                contractTransaction: result?.contractTransaction,
                transactionReceipt: result?.transactionReceipt,
                collateralPermit: result?.collateralPermit,
                rPermit: result?.rPermit,
                request,
                txnId,
              } as ApproveResponse),
          ),
          catchError(error => {
            console.error('useApprove - Failed to execute approve!', error);
            return of({
              request,
              error,
              txnId,
            });
          }),
        );
      } catch (error) {
        console.error('useApprove - Failed to execute approve!', error);
        return of({
          request,
          error,
          txnId,
        });
      }
    },
  ),
  map<ApproveResponse, ApproveStatus>(response => {
    const { contractTransaction, transactionReceipt, collateralPermit, rPermit, request, error, txnId } = response;

    if (!rPermit) {
      if (!contractTransaction) {
        const userRejectError = new Error('Rejected by user.');
        return { pending: false, success: false, error: error ?? userRejectError, request, txnId } as ApproveStatus;
      }

      if (!transactionReceipt) {
        const receiptFetchFailed = new Error('Failed to fetch approve transaction receipt!');
        return { pending: false, success: false, error: error ?? receiptFetchFailed, request, txnId } as ApproveStatus;
      }
    }

    return {
      pending: false,
      success: true,
      request,
      contractTransaction,
      collateralPermit,
      rPermit,
      txnId,
    };
  }),
  tap(status => {
    emitAppEvent({
      eventType: 'approve-token',
      timestamp: Date.now(),
      txnHash: status.contractTransaction?.hash,
    });

    notification$.next({
      notificationId: status.txnId,
      notificationType: status.success ? 'approval-success' : 'approval-error',
      timestamp: Date.now(),
    });

    approveStatus$.next(status);
  }),
);

const [approveStatus] = bind<Nullable<ApproveStatus>>(approveStatus$, null);

export const useApprove = (): {
  approveStatus: Nullable<ApproveStatus>;
  approve: (payload: ApproveRequest) => void;
} => ({
  approveStatus: approveStatus(),
  approve,
});

let subscriptions: Subscription[];

export const subscribeApproveStatus = (): void => {
  unsubscribeApproveStatus();
  subscriptions = [stream$.subscribe()];
};
export const unsubscribeApproveStatus = (): void => subscriptions?.forEach(subscription => subscription.unsubscribe());
export const resetApproveStatus = (): void => {
  approveStatus$.next(null);
};

// We can move this to hookSubscriber component if needed
subscribeApproveStatus();
