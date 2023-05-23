import { BrowserProvider, JsonRpcSigner, ContractTransactionResponse, TransactionReceipt } from 'ethers';
import { Decimal } from '@tempusfinance/decimal';
import { bind } from '@react-rxjs/core';
import { createSignal } from '@react-rxjs/utils';
import { CollateralToken, UserPosition } from '@raft-fi/sdk';
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

interface WhitelistDelegateRequest {
  txnId: string;
  token: CollateralToken;
}

interface WhitelistDelegateStatus {
  pending: boolean;
  request: WhitelistDelegateRequest;
  success?: boolean;
  error?: Error;
  contractTransaction?: ContractTransactionResponse;
  txnId: string;
}

interface WhitelistDelegateResponse {
  request: WhitelistDelegateRequest;
  contractTransaction?: ContractTransactionResponse;
  transactionReceipt?: TransactionReceipt;
  whitelistNeeded?: boolean;
  error?: Error;
  txnId: string;
}

const [whitelistDelegate$, whitelistDelegate] = createSignal<WhitelistDelegateRequest>();
const whitelistDelegateStatus$ = new BehaviorSubject<Nullable<WhitelistDelegateStatus>>(null);

const stream$ = combineLatest([whitelistDelegate$]).pipe(
  withLatestFrom(wallet$, walletSigner$),
  concatMap<
    [[WhitelistDelegateRequest], Nullable<BrowserProvider>, Nullable<JsonRpcSigner>],
    Observable<WhitelistDelegateResponse>
  >(([[request], walletProvider, walletSigner]) => {
    const { txnId, token } = request;

    try {
      if (!walletProvider || !walletSigner) {
        return of({
          request,
          error: new Error('Wallet provider/signer not defined!'),
          txnId,
        });
      }

      const userPosition = new UserPosition(walletSigner, Decimal.ZERO, Decimal.ZERO);

      whitelistDelegateStatus$.next({ pending: true, txnId, request });

      const result$ = from(userPosition.whitelistWalletForCollateral(token));

      const waitForTxReceipt$ = result$.pipe(
        concatMap(result => {
          if (result instanceof ContractTransactionResponse) {
            if (result.hash) {
              return from(walletProvider.waitForTransaction(result.hash, NUMBER_OF_CONFIRMATIONS_FOR_TX)).pipe(
                map(transactionReceipt => ({
                  contractTransaction: result,
                  transactionReceipt,
                  whitelistNotNeeded: false,
                })),
              );
            } else {
              return of(null);
            }
          }
          return of({
            contractTransaction: null,
            transactionReceipt: null,
            whitelistNotNeeded: true,
          });
        }),
      );

      return waitForTxReceipt$.pipe(
        map(
          result =>
            ({
              contractTransaction: result?.contractTransaction,
              transactionReceipt: result?.transactionReceipt,
              whitelistNeeded: result?.whitelistNotNeeded,
              request,
              txnId,
            } as WhitelistDelegateResponse),
        ),
        catchError(error => {
          console.error('useWhitelistDelegate - Failed to execute whitelistDelegate!', error);
          return of({
            request,
            error,
            txnId,
          });
        }),
      );
    } catch (error) {
      console.error('useWhitelistDelegate - Failed to execute whitelistDelegate!', error);
      return of({
        request,
        error,
        txnId,
      });
    }
  }),
  map<WhitelistDelegateResponse, WhitelistDelegateStatus>(response => {
    const { contractTransaction, transactionReceipt, whitelistNeeded, request, error, txnId } = response;

    if (!whitelistNeeded) {
      if (!contractTransaction) {
        const userRejectError = new Error('Rejected by user.');
        return {
          pending: false,
          success: false,
          error: error ?? userRejectError,
          request,
          txnId,
        } as WhitelistDelegateStatus;
      }

      if (!transactionReceipt) {
        const receiptFetchFailed = new Error('Failed to fetch whitelistDelegate transaction receipt!');
        return {
          pending: false,
          success: false,
          error: error ?? receiptFetchFailed,
          request,
          txnId,
        } as WhitelistDelegateStatus;
      }
    }

    return {
      pending: false,
      success: true,
      request,
      contractTransaction,
      whitelistNeeded,
      txnId,
    };
  }),
  tap(status => {
    emitAppEvent({
      eventType: 'whitelist-delegate-token',
      timestamp: Date.now(),
      txnHash: status.contractTransaction?.hash,
    });

    whitelistDelegateStatus$.next(status);
  }),
);

const [whitelistDelegateStatus] = bind<Nullable<WhitelistDelegateStatus>>(whitelistDelegateStatus$, null);

export const useWhitelistDelegate = (): {
  whitelistDelegateStatus: Nullable<WhitelistDelegateStatus>;
  whitelistDelegate: (payload: WhitelistDelegateRequest) => void;
} => ({
  whitelistDelegateStatus: whitelistDelegateStatus(),
  whitelistDelegate,
});

let subscriptions: Subscription[];

export const subscribeWhitelistDelegateStatus = (): void => {
  unsubscribeWhitelistDelegateStatus();
  subscriptions = [stream$.subscribe()];
};
export const unsubscribeWhitelistDelegateStatus = (): void =>
  subscriptions?.forEach(subscription => subscription.unsubscribe());
export const resetWhitelistDelegateStatus = (): void => {
  whitelistDelegateStatus$.next(null);
};

// We can move this to hookSubscriber component if needed
subscribeWhitelistDelegateStatus();
