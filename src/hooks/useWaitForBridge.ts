import { Bridge } from '@raft-fi/sdk';
import { bind } from '@react-rxjs/core';
import { ContractTransactionResponse } from 'ethers';
import { BehaviorSubject, Subscription, combineLatest, tap, withLatestFrom } from 'rxjs';
import { NETWORK_RPC_URLS } from '../constants';
import { Nullable } from '../interfaces';
import { bridgeTokensStatus$, BridgeTokensStepsRequest, bridgeTokensStepsRequest$ } from './useBridgeTokens';
import { walletSigner$ } from './useWalletSigner';

interface WaitForBridgeStatus {
  pending: boolean;
  success: boolean;
  statusType: 'waitForBridge';
  request: Nullable<BridgeTokensStepsRequest>;
  txHash?: string;
  error?: Error;
}

const DEFAULT_VALUE: WaitForBridgeStatus = {
  pending: false,
  success: false,
  statusType: 'waitForBridge',
  request: null,
};

export const waitForBridgeStatus$ = new BehaviorSubject<WaitForBridgeStatus>(DEFAULT_VALUE);

const stream$ = combineLatest([bridgeTokensStatus$, walletSigner$]).pipe(
  withLatestFrom(bridgeTokensStepsRequest$),
  tap(async ([[status, signer], request]) => {
    if (status.statusType !== 'bridgeTokens' || !status.response || !status.success || !signer) {
      waitForBridgeStatus$.next(DEFAULT_VALUE);
      return;
    }

    const { txnResponse, txnReceipt } = status.response;
    const { sourceChainName, destinationChainName } = request;

    const rpc = NETWORK_RPC_URLS[destinationChainName];

    try {
      const bridge = new Bridge(signer);

      waitForBridgeStatus$.next({ ...DEFAULT_VALUE, pending: true, request });

      const messageId = await bridge.getBridgeMessageId(txnResponse as ContractTransactionResponse, txnReceipt);

      waitForBridgeStatus$.next({ ...DEFAULT_VALUE, pending: true, request, txHash: messageId });

      await bridge.waitForBridgeToComplete(messageId, sourceChainName, rpc, destinationChainName);

      waitForBridgeStatus$.next({ ...DEFAULT_VALUE, success: true, request, txHash: messageId });
    } catch (error) {
      console.error(`useWaitForBridge (error) - failed to wait for bridge status!`, error);
      waitForBridgeStatus$.next({ ...DEFAULT_VALUE, error: error as Error });
    }
  }),
);

export const [useWaitForBridge] = bind<WaitForBridgeStatus>(waitForBridgeStatus$, DEFAULT_VALUE);

let subscriptions: Subscription[];

export const subscribeWaitForBridgeStatus = (): void => {
  unsubscribeWaitForBridgeStatus();
  subscriptions = [stream$.subscribe()];
};
export const unsubscribeWaitForBridgeStatus = (): void =>
  subscriptions?.forEach(subscription => subscription.unsubscribe());
export const resetWaitForBridgeStatus = (): void => {
  waitForBridgeStatus$.next(DEFAULT_VALUE);
};
