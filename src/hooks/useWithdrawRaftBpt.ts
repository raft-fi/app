import { BrowserProvider, JsonRpcSigner, TransactionResponse } from 'ethers';
import { bind } from '@react-rxjs/core';
import { createSignal } from '@react-rxjs/utils';
import { RaftToken } from '@raft-fi/sdk';
import { concatMap, map, tap, BehaviorSubject, Subscription, withLatestFrom } from 'rxjs';
import { Nullable } from '../interfaces';
import { wallet$ } from './useWallet';
import { walletSigner$ } from './useWalletSigner';
import { emitAppEvent } from './useAppEvent';
import { raftToken$ } from './useRaftToken';
import { Decimal } from '@tempusfinance/decimal';
import { waitForTransactionReceipt } from '../utils';

interface WithdrawRaftBptRequest {
  withdrawAmount: Decimal;
  txnId: string;
}

interface WithdrawRaftBptStatus {
  pending: boolean;
  request: WithdrawRaftBptRequest;
  success?: boolean;
  error?: Error;
  txnId: string;
  statusType: 'stake-withdraw';
  txHash?: string;
}

interface WithdrawRaftBptResponse {
  request: WithdrawRaftBptRequest;
  txnResponse?: TransactionResponse;
  error?: Error;
  txnId: string;
}

const [withdrawRaftBpt$, withdrawRaftBpt] = createSignal<WithdrawRaftBptRequest>();
const withdrawRaftBptStatus$ = new BehaviorSubject<Nullable<WithdrawRaftBptStatus>>(null);

const stream$ = withdrawRaftBpt$.pipe(
  withLatestFrom(raftToken$, wallet$, walletSigner$),
  concatMap<
    [WithdrawRaftBptRequest, Nullable<RaftToken>, Nullable<BrowserProvider>, Nullable<JsonRpcSigner>],
    Promise<WithdrawRaftBptResponse>
  >(async ([request, raftToken, walletProvider, walletSigner]) => {
    const { txnId } = request;

    try {
      if (!raftToken || !walletProvider || !walletSigner) {
        return {
          request,
          error: new Error('Wallet provider/signer not defined!'),
          txnId,
        };
      }

      withdrawRaftBptStatus$.next({ pending: true, txnId, request, statusType: 'stake-withdraw' });

      const txnResponse = await raftToken.withdrawVeRaft(walletSigner);

      if (txnResponse?.hash) {
        await waitForTransactionReceipt(txnResponse.hash, walletProvider);
      }

      return {
        request,
        txnResponse,
        txnId,
      };
    } catch (error) {
      console.error('useWithdrawRaftBpt - Failed to execute withdrawRaftBpt!', error);
      return {
        request,
        error,
        txnId,
      } as WithdrawRaftBptResponse;
    }
  }),
  map<WithdrawRaftBptResponse, WithdrawRaftBptStatus>(response => {
    const { txnResponse, request, error, txnId } = response;

    if (!txnResponse) {
      const userRejectError = new Error('Rejected by user.');
      return {
        pending: false,
        success: false,
        error: error ?? userRejectError,
        request,
        txnId,
        statusType: 'stake-withdraw',
      } as WithdrawRaftBptStatus;
    }

    if (error) {
      return {
        pending: false,
        success: false,
        error,
        request,
        txnId,
        statusType: 'stake-withdraw',
        txHash: txnResponse?.hash,
      } as WithdrawRaftBptStatus;
    }

    return {
      pending: false,
      success: true,
      request,
      txnResponse,
      txnId,
      statusType: 'stake-withdraw',
      txHash: txnResponse?.hash,
    };
  }),
  tap(status => {
    emitAppEvent({
      eventType: 'stake-withdraw',
      timestamp: Date.now(),
      txnHash: status.txHash,
    });

    withdrawRaftBptStatus$.next(status);
  }),
);

const [withdrawRaftBptStatus] = bind<Nullable<WithdrawRaftBptStatus>>(withdrawRaftBptStatus$, null);

export const useWithdrawRaftBpt = (): {
  withdrawRaftBptStatus: Nullable<WithdrawRaftBptStatus>;
  withdrawRaftBpt: (payload: WithdrawRaftBptRequest) => void;
} => ({
  withdrawRaftBptStatus: withdrawRaftBptStatus(),
  withdrawRaftBpt,
});

let subscriptions: Subscription[];

export const subscribeWithdrawRaftBptStatus = (): void => {
  unsubscribeWithdrawRaftBptStatus();
  subscriptions = [stream$.subscribe()];
};
export const unsubscribeWithdrawRaftBptStatus = (): void =>
  subscriptions?.forEach(subscription => subscription.unsubscribe());
export const resetWithdrawRaftBptStatus = (): void => {
  withdrawRaftBptStatus$.next(null);
};
