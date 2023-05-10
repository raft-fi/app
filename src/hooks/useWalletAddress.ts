import { bind } from '@react-rxjs/core';
import { switchMap } from 'rxjs';
import { wallet$ } from './useWallet';

export const walletAddress$ = wallet$.pipe(
  switchMap(async wallet => {
    if (!wallet) {
      return null;
    }

    const accounts = await wallet.listAccounts();

    if (!accounts[0]?.address) {
      return null;
    }
    return accounts[0].address;
  }),
);

export const [useWalletAddress] = bind(walletAddress$, null);
