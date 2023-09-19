import { EIP1193Provider } from '@web3-onboard/common';
import { BrowserProvider } from 'ethers';
import { BehaviorSubject, tap, Subscription } from 'rxjs';
import { bind } from '@react-rxjs/core';
import { Nullable } from '../interfaces';
import { emitAppEvent } from './useAppEvent';
import { notification$ } from './useNotification';

const DEFAULT_VALUE = null;

const wallet$ = new BehaviorSubject<Nullable<BrowserProvider>>(DEFAULT_VALUE);
const walletLabel$ = new BehaviorSubject<Nullable<string>>(DEFAULT_VALUE);
const eip1193Provider$ = new BehaviorSubject<Nullable<EIP1193Provider>>(DEFAULT_VALUE);

const updateWalletFromEIP1193Provider = (eip1193Provider: Nullable<EIP1193Provider>) => {
  eip1193Provider$.next(eip1193Provider);
};

const updateWalletLabel = (label: Nullable<string>) => {
  walletLabel$.next(label);
};

const stream$ = eip1193Provider$.pipe(
  tap(eip1193Provider => {
    if (!eip1193Provider) {
      wallet$.next(null);
      emitAppEvent(null);
      notification$.next(null);
    } else {
      wallet$.next(new BrowserProvider(eip1193Provider));
    }
  }),
);

export const [useWallet] = bind(wallet$, DEFAULT_VALUE);
export const [useEIP1193Provider] = bind(eip1193Provider$, DEFAULT_VALUE);

export { wallet$, eip1193Provider$, walletLabel$, updateWalletFromEIP1193Provider, updateWalletLabel };

let subscription: Subscription;

export const subscribeEIP1193Provider = (): void => {
  unsubscribeEIP1193Provider();
  subscription = stream$.subscribe();
};
export const unsubscribeEIP1193Provider = (): void => subscription?.unsubscribe();
export const resetEIP1193Provider = (): void => eip1193Provider$.next(DEFAULT_VALUE);
