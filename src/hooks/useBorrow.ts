import { BrowserProvider, JsonRpcSigner, ethers } from 'ethers';
import { Decimal } from 'tempus-decimal';
import { bind } from '@react-rxjs/core';
import { createSignal } from '@react-rxjs/utils';
import { CollateralTokenType, UserPosition } from '@raft-fi/sdk';
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
  switchMap,
  Observable,
} from 'rxjs';
import { Nullable } from '../interfaces';
import { NUMBER_OF_CONFIRMATIONS_FOR_TX } from '../constants';
import { wallet$ } from './useWallet';
import { walletSigner$ } from './useWalletSigner';
import { emitAppEvent } from './useAppEvent';

interface BorrowRequest {
  txnId: string;
  collateralToken: CollateralTokenType;
  collateralAmount: Decimal;
  debtAmount: Decimal;
  currentUserCollateral: Decimal;
  currentUserDebt: Decimal;
}

interface BorrowStatus {
  pending: boolean;
  request: BorrowRequest;
  success?: boolean;
  error?: Error;
  contractTransaction?: ethers.ContractTransactionResponse;
  transactionData?: {
    borrowedAmount: Decimal;
    gasFee: Decimal;
  };
  txnId: string;
}

interface BorrowResponse {
  request: BorrowRequest;
  contractTransaction?: ethers.ContractTransactionResponse;
  transactionReceipt?: ethers.TransactionReceipt;
  transactionData?: {
    borrowedAmount: Decimal;
    gasFee: Decimal;
  };
  error?: Error;
  txnId: string;
}

const [borrow$, borrow] = createSignal<BorrowRequest>();
const borrowStatus$ = new BehaviorSubject<Nullable<BorrowStatus>>(null);

const stream$ = combineLatest([borrow$, wallet$, walletSigner$]).pipe(
  concatMap<[BorrowRequest, Nullable<BrowserProvider>, Nullable<JsonRpcSigner>], Observable<BorrowResponse>>(
    ([request, walletProvider, walletSigner]) => {
      const { txnId, currentUserCollateral, currentUserDebt, collateralToken, collateralAmount, debtAmount } = request;

      try {
        if (!walletProvider || !walletSigner) {
          return of({
            request,
            error: new Error('Wallet provider/signer not defined!'),
            txnId,
          });
        }

        const userPosition = new UserPosition(walletSigner, collateralToken, currentUserCollateral, currentUserDebt);

        borrowStatus$.next({ pending: true, txnId, request });

        let result$: Observable<ethers.ContractTransactionResponse>;
        if (collateralAmount.equals(0) && debtAmount.equals(0)) {
          result$ = from(userPosition.close());
        } else {
          result$ = from(userPosition.open(collateralAmount, debtAmount));
        }

        const waitForTxReceipt$ = result$.pipe(
          concatMap(result => {
            if (result.hash) {
              return from(walletProvider.waitForTransaction(result.hash, NUMBER_OF_CONFIRMATIONS_FOR_TX));
            }
            return of(null);
          }),
        );

        return combineLatest([result$, waitForTxReceipt$]).pipe(
          switchMap(async ([contractTransaction, transactionReceipt]) => {
            if (contractTransaction && transactionReceipt) {
              return {
                transactionReceipt,
                contractTransaction,
              };
            }
          }),
          map(
            result =>
              ({
                contractTransaction: result?.contractTransaction,
                transactionReceipt: result?.transactionReceipt,
                request,
                txnId,
              } as BorrowResponse),
          ),
          catchError(error => {
            console.error('useBorrow - Failed to execute borrow!', error);
            return of({
              request,
              error,
              txnId,
            });
          }),
        );
      } catch (error) {
        console.error('useBorrow - Failed to execute borrow!', error);
        return of({
          request,
          error,
          txnId,
        });
      }
    },
  ),
  map<BorrowResponse, BorrowStatus>(response => {
    const { contractTransaction, transactionReceipt, request, error, txnId } = response;

    if (!contractTransaction) {
      const userRejectError = new Error('Rejected by user.');
      return { pending: false, success: false, error: error ?? userRejectError, request, txnId } as BorrowStatus;
    }

    if (!transactionReceipt) {
      const receiptFetchFailed = new Error('Failed to fetch borrow transaction receipt!');
      return { pending: false, success: false, error: error ?? receiptFetchFailed, request, txnId } as BorrowStatus;
    }

    try {
      return {
        pending: false,
        success: true,
        request,
        contractTransaction: contractTransaction,
        txnId,
      };
    } catch (error) {
      console.error('useBorrow - Failed to parse transaction receipt!', error);
      return { pending: false, success: false, error, request, txnId } as BorrowStatus;
    }
  }),
  tap(status => {
    emitAppEvent({
      eventType: 'manage-position',
      timestamp: Date.now(),
      txnHash: status.contractTransaction?.hash,
    });

    borrowStatus$.next(status);
  }),
);

const [borrowStatus] = bind<Nullable<BorrowStatus>>(borrowStatus$, null);

export const useBorrow = (): {
  borrowStatus: Nullable<BorrowStatus>;
  borrow: (payload: BorrowRequest) => void;
} => ({
  borrowStatus: borrowStatus(),
  borrow,
});

let subscriptions: Subscription[];

export const subscribeBorrowStatus = (): void => {
  unsubscribeBorrowStatus();
  subscriptions = [stream$.subscribe()];
};
export const unsubscribeBorrowStatus = (): void => subscriptions?.forEach(subscription => subscription.unsubscribe());
export const resetBorrowStatus = (): void => {
  borrowStatus$.next(null);
};

// We can move this to hookSubscriber component if needed
subscribeBorrowStatus();
