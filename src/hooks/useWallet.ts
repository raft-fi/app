import { BrowserProvider } from 'ethers';
import { BehaviorSubject } from 'rxjs';
import { bind } from '@react-rxjs/core';
import { Nullable } from '../interfaces';

const DEFAULT_VALUE = null;

const wallet$ = new BehaviorSubject<Nullable<BrowserProvider>>(DEFAULT_VALUE);

const updateWallet = (wallet: Nullable<BrowserProvider>) => {
  wallet$.next(wallet);
};

export const [useWallet] = bind(wallet$, DEFAULT_VALUE);

export { wallet$, updateWallet };
