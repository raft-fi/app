import { bind } from '@react-rxjs/core';
import { switchMap, filter } from 'rxjs';
import { wallet$ } from './useWallet';
import { BrowserProvider } from 'ethers';

export const walletAddress$ = wallet$.pipe(
  filter((wallet): wallet is BrowserProvider => Boolean(wallet)),
  switchMap(async wallet => {
    const accounts = await wallet.listAccounts();

    if (!accounts[0]?.address) {
      return null;
    }
    return accounts[0].address;
  }),
);

export const [useWalletAddress] = bind(walletAddress$, null);
