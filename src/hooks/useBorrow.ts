import { BrowserProvider, JsonRpcSigner, ethers } from 'ethers';
import Decimal from 'decimal';
import { bind } from '@react-rxjs/core';
import { createSignal } from '@react-rxjs/utils';
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
import { wallet$ } from './useWallet';
import { CollateralToken, Nullable } from '../interfaces';
import { walletSigner$ } from './useWalletSigner';
import PositionManagerService from '../services/PositionManagerService';

interface BorrowRequest {
  txnId: string;
  collateralToken: CollateralToken;
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
  contractTransaction?: ethers.ContractTransaction;
  transactionData?: {
    borrowedAmount: Decimal;
    gasFee: Decimal;
  };
  txnId: string;
}

interface BorrowResponse {
  request: BorrowRequest;
  contractTransaction?: ethers.ContractTransaction | void;
  transactionReceipt?: ethers.TransactionReceipt | void;
  transactionData?: {
    borrowedAmount: Decimal;
    gasFee: Decimal;
  };
  error?: Error;
  txnId: string;
}

const [borrow$, borrow] = createSignal<BorrowRequest>();
const borrowStatus$ = new BehaviorSubject<BorrowStatus | null>(null);

const stream$ = combineLatest([borrow$, wallet$, walletSigner$]).pipe(
  concatMap<[BorrowRequest, Nullable<BrowserProvider>, Nullable<JsonRpcSigner>], Observable<BorrowResponse>>(
    ([request, walletProvider, walletSigner]) => {
      const { txnId, collateralToken, collateralAmount, debtAmount } = request;

      try {
        if (!walletProvider || !walletSigner) {
          return of({
            request,
            error: new Error('Wallet provider/signer not defined!'),
            txnId,
          });
        }

        const userPosition = new PositionManagerService(walletSigner, collateralToken);

        borrowStatus$.next({ pending: true, txnId, request });

        const result$ = from(userPosition.open(collateralAmount, debtAmount));
        const waitForTxReceipt$ = result$.pipe(
          switchMap(result => {
            if (result) {
              return of(true);
            }
            return of(null);
          }),
        );

        return combineLatest([result$, waitForTxReceipt$]).pipe(
          switchMap(async ([contractTransaction, transactionReceipt]) => {
            if (contractTransaction) {
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
                getTransactionReceipt: result?.transactionReceipt,
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
    const { contractTransaction: contractTransaction, transactionReceipt, request, error, txnId } = response;

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
    borrowStatus$.next(status);
  }),
);

const [borrowStatus] = bind<BorrowStatus | null>(borrowStatus$, null);

export const useBorrow = (): {
  borrowStatus: BorrowStatus | null;
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