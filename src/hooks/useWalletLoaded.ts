import { bind } from '@react-rxjs/core';
import { BehaviorSubject, Subscription, interval, map, tap, takeWhile } from 'rxjs';
import { wallet$ } from './useWallet';
import { position$ } from './usePosition';

const DEFAULT_VALUE = false;
const CHECK_INTERVAL = 1000;

const walletLoaded$ = new BehaviorSubject<boolean>(DEFAULT_VALUE);

const stream$ = interval(CHECK_INTERVAL).pipe(
  map(count => {
    const wallet = wallet$.getValue();
    const position = position$.getValue();

    return Boolean(count && (!wallet || (wallet && position)));
  }),
  tap(loaded => walletLoaded$.next(loaded)),
  takeWhile(loaded => !loaded),
);

export const [useWalletLoaded] = bind(walletLoaded$, DEFAULT_VALUE);

let subscription: Subscription;

export const subscribeWalletLoaded = (): void => {
  unsubscribeWalletLoaded();
  subscription = stream$.subscribe();
};
export const unsubscribeWalletLoaded = (): void => subscription?.unsubscribe();
export const resetWalletLoaded = (): void => walletLoaded$.next(DEFAULT_VALUE);

subscribeWalletLoaded();
