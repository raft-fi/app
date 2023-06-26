import { BrowserProvider, JsonRpcProvider, JsonRpcSigner, ethers } from 'ethers';
import { Decimal } from '@tempusfinance/decimal';
import { bind } from '@react-rxjs/core';
import { createSignal } from '@react-rxjs/utils';
import { UnderlyingCollateralToken, TransactionWithFeesOptions, Protocol } from '@raft-fi/sdk';
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
  withLatestFrom,
} from 'rxjs';
import { Nullable } from '../interfaces';
import { NUMBER_OF_CONFIRMATIONS_FOR_TX } from '../constants';
import { wallet$ } from './useWallet';
import { walletSigner$ } from './useWalletSigner';
import { emitAppEvent } from './useAppEvent';
import { provider$ } from './useProvider';

interface RedeemRequest {
  txnId: string;
  underlyingCollateralToken: UnderlyingCollateralToken;
  debtAmount: Decimal;
  options?: TransactionWithFeesOptions;
}

interface RedeemStatus {
  pending: boolean;
  request: RedeemRequest;
  success?: boolean;
  error?: Error;
  contractTransaction?: ethers.TransactionResponse;
  transactionData?: {
    amount: Decimal;
    gasFee: Decimal;
  };
  txnId: string;
  statusType: 'redeem';
}

interface RedeemResponse {
  request: RedeemRequest;
  contractTransaction?: ethers.TransactionResponse;
  transactionReceipt?: ethers.TransactionReceipt;
  transactionData?: {
    amount: Decimal;
    gasFee: Decimal;
  };
  error?: Error;
  txnId: string;
}

const GAS_LIMIT_MULTIPLIER = new Decimal(2);

const [redeem$, redeem] = createSignal<RedeemRequest>();
const redeemStatus$ = new BehaviorSubject<Nullable<RedeemStatus>>(null);

const stream$ = combineLatest([redeem$]).pipe(
  withLatestFrom(provider$, wallet$, walletSigner$),
  concatMap<
    [[RedeemRequest], JsonRpcProvider, Nullable<BrowserProvider>, Nullable<JsonRpcSigner>],
    Observable<RedeemResponse>
  >(([[request], provider, walletProvider, walletSigner]) => {
    const { txnId, underlyingCollateralToken, debtAmount, options = {} } = request;

    try {
      if (!walletProvider || !walletSigner) {
        return of({
          request,
          error: new Error('Wallet provider/signer not defined!'),
          txnId,
        });
      }

      const protocol = Protocol.getInstance(provider);

      redeemStatus$.next({ pending: true, txnId, request, statusType: 'redeem' });

      const result$ = from(
        protocol.redeemCollateral(underlyingCollateralToken, debtAmount, walletSigner, {
          ...options,
          gasLimitMultiplier: GAS_LIMIT_MULTIPLIER,
        }),
      );

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
            } as RedeemResponse),
        ),
        catchError(error => {
          console.error('useRedeem - Failed to execute redeem!', error);
          return of({
            request,
            error,
            txnId,
          });
        }),
      );
    } catch (error) {
      console.error('useRedeem - Failed to execute redeem!', error);
      return of({
        request,
        error,
        txnId,
      });
    }
  }),
  map<RedeemResponse, RedeemStatus>(response => {
    const { contractTransaction, transactionReceipt, request, error, txnId } = response;

    if (!contractTransaction) {
      const userRejectError = new Error('Rejected by user.');
      return {
        pending: false,
        success: false,
        error: error ?? userRejectError,
        request,
        txnId,
        statusType: 'redeem',
      } as RedeemStatus;
    }

    if (!transactionReceipt) {
      const receiptFetchFailed = new Error('Failed to fetch redeem transaction receipt!');
      return {
        pending: false,
        success: false,
        error: error ?? receiptFetchFailed,
        request,
        txnId,
        statusType: 'redeem',
      } as RedeemStatus;
    }

    return {
      pending: false,
      success: true,
      request,
      contractTransaction,
      txnId,
      statusType: 'redeem',
    };
  }),
  tap(status => {
    emitAppEvent({
      eventType: 'redeem',
      timestamp: Date.now(),
      txnHash: status.contractTransaction?.hash,
    });

    redeemStatus$.next(status);
  }),
);

const [redeemStatus] = bind<Nullable<RedeemStatus>>(redeemStatus$, null);

export const useRedeem = (): {
  redeemStatus: Nullable<RedeemStatus>;
  redeem: (payload: RedeemRequest) => void;
} => ({
  redeemStatus: redeemStatus(),
  redeem,
});

let subscriptions: Subscription[];

export const subscribeRedeemStatus = (): void => {
  unsubscribeRedeemStatus();
  subscriptions = [stream$.subscribe()];
};
export const unsubscribeRedeemStatus = (): void => subscriptions?.forEach(subscription => subscription.unsubscribe());
export const resetRedeemStatus = (): void => {
  redeemStatus$.next(null);
};

// We can move this to hookSubscriber component if needed
subscribeRedeemStatus();
