import { BrowserProvider, JsonRpcSigner, TransactionResponse } from 'ethers';
import { bind } from '@react-rxjs/core';
import { createSignal } from '@react-rxjs/utils';
import { RaftToken } from '@raft-fi/sdk';
import { concatMap, map, tap, BehaviorSubject, Subscription, withLatestFrom } from 'rxjs';
import { Nullable } from '../interfaces';
import { NUMBER_OF_CONFIRMATIONS_FOR_TX } from '../constants';
import { wallet$ } from './useWallet';
import { walletSigner$ } from './useWalletSigner';
import { emitAppEvent } from './useAppEvent';
import { raftToken$ } from './useRaftToken';

interface ClaimRaftFromStakedBptRequest {
  txnId: string;
}

interface ClaimRaftFromStakedBptStatus {
  pending: boolean;
  request: ClaimRaftFromStakedBptRequest;
  success?: boolean;
  error?: Error;
  txnId: string;
  statusType: 'stake-claim';
  txHash?: string;
}

interface ClaimRaftFromStakedBptResponse {
  request: ClaimRaftFromStakedBptRequest;
  txnResponse?: TransactionResponse;
  error?: Error;
  txnId: string;
}

const [claimRaftFromStakedBpt$, claimRaftFromStakedBpt] = createSignal<ClaimRaftFromStakedBptRequest>();
const claimRaftFromStakedBptStatus$ = new BehaviorSubject<Nullable<ClaimRaftFromStakedBptStatus>>(null);

const stream$ = claimRaftFromStakedBpt$.pipe(
  withLatestFrom(raftToken$, wallet$, walletSigner$),
  concatMap<
    [ClaimRaftFromStakedBptRequest, Nullable<RaftToken>, Nullable<BrowserProvider>, Nullable<JsonRpcSigner>],
    Promise<ClaimRaftFromStakedBptResponse>
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

      claimRaftFromStakedBptStatus$.next({ pending: true, txnId, request, statusType: 'stake-claim' });

      const txnResponse = await raftToken.claimRaftFromStakedBpt(walletSigner);

      if (txnResponse?.hash) {
        await walletProvider.waitForTransaction(txnResponse.hash, NUMBER_OF_CONFIRMATIONS_FOR_TX);
      }

      return {
        request,
        txnResponse,
        txnId,
      };
    } catch (error) {
      console.error('useClaimRaftFromStakedBpt - Failed to execute claimRaftFromStakedBpt!', error);
      return {
        request,
        error,
        txnId,
      } as ClaimRaftFromStakedBptResponse;
    }
  }),
  map<ClaimRaftFromStakedBptResponse, ClaimRaftFromStakedBptStatus>(response => {
    const { txnResponse, request, error, txnId } = response;

    if (!txnResponse) {
      const userRejectError = new Error('Rejected by user.');
      return {
        pending: false,
        success: false,
        error: error ?? userRejectError,
        request,
        txnId,
        statusType: 'stake-claim',
      } as ClaimRaftFromStakedBptStatus;
    }

    if (error) {
      return {
        pending: false,
        success: false,
        error,
        request,
        txnId,
        statusType: 'stake-claim',
        txHash: txnResponse?.hash,
      } as ClaimRaftFromStakedBptStatus;
    }

    return {
      pending: false,
      success: true,
      request,
      txnResponse,
      txnId,
      statusType: 'stake-claim',
      txHash: txnResponse?.hash,
    };
  }),
  tap(status => {
    emitAppEvent({
      eventType: 'stake-claim',
      timestamp: Date.now(),
      txnHash: status.txHash,
    });

    claimRaftFromStakedBptStatus$.next(status);
  }),
);

const [claimRaftFromStakedBptStatus] = bind<Nullable<ClaimRaftFromStakedBptStatus>>(
  claimRaftFromStakedBptStatus$,
  null,
);

export const useClaimRaftFromStakedBpt = (): {
  claimRaftFromStakedBptStatus: Nullable<ClaimRaftFromStakedBptStatus>;
  claimRaftFromStakedBpt: (payload: ClaimRaftFromStakedBptRequest) => void;
} => ({
  claimRaftFromStakedBptStatus: claimRaftFromStakedBptStatus(),
  claimRaftFromStakedBpt,
});

let subscriptions: Subscription[];

export const subscribeClaimRaftFromStakedBptStatus = (): void => {
  unsubscribeClaimRaftFromStakedBptStatus();
  subscriptions = [stream$.subscribe()];
};
export const unsubscribeClaimRaftFromStakedBptStatus = (): void =>
  subscriptions?.forEach(subscription => subscription.unsubscribe());
export const resetClaimRaftFromStakedBptStatus = (): void => {
  claimRaftFromStakedBptStatus$.next(null);
};

subscribeClaimRaftFromStakedBptStatus();
