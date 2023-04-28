import { bind } from '@react-rxjs/core';
import { switchMap } from 'rxjs';
import { wallet$ } from './useWallet';

export const walletSigner$ = wallet$.pipe(switchMap(async wallet => (await wallet?.getSigner()) ?? null));

export const [useWalletSigner] = bind(walletSigner$, null);
