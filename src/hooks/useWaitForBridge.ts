import { Bridge } from '@raft-fi/sdk';
import { bind } from '@react-rxjs/core';
import { ContractTransactionResponse } from 'ethers';
import { BehaviorSubject, Subscription, combineLatest, tap, withLatestFrom } from 'rxjs';
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

    let rpc = '';
    switch (destinationChainName) {
      case 'arbitrumGoerli':
        rpc = import.meta.env.VITE_ARBITRUM_GOERLI_RPC_URL;
        break;
      case 'base':
        rpc = import.meta.env.VITE_BASE_MAINNET_RPC_URL;
        break;
      case 'ethereum':
        rpc = import.meta.env.VITE_MAINNET_RPC_URL;
        break;
      case 'ethereumSepolia':
        rpc = import.meta.env.VITE_ETHEREUM_SEPOLIA_RPC_URL;
        break;
    }

    try {
      const bridge = new Bridge(signer);

      waitForBridgeStatus$.next({ ...DEFAULT_VALUE, pending: true, request, txHash: status.txHash });

      const messageId = await bridge.getBridgeMessageId(txnResponse as ContractTransactionResponse, txnReceipt);
      await bridge.waitForBridgeToComplete(messageId, sourceChainName, rpc, destinationChainName);

      waitForBridgeStatus$.next({ ...DEFAULT_VALUE, success: true, request, txHash: messageId });
    } catch (e) {
      waitForBridgeStatus$.next({ ...DEFAULT_VALUE, error: e as Error });
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
