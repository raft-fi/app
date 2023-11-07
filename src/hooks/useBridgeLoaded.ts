import { bind } from '@react-rxjs/core';
import { BehaviorSubject, Subscription, interval, map, tap, takeWhile } from 'rxjs';
import { SUPPORTED_BRIDGE_NETWORKS } from '../networks';
import { bridgeBalances$ } from './useBridgeBalances';
import { ethPrice$ } from './useEthPrice';
import { wallet$ } from './useWallet';

const DEFAULT_VALUE = false;
const CHECK_INTERVAL = 1000;

const bridgeLoaded$ = new BehaviorSubject<boolean>(DEFAULT_VALUE);

const stream$ = interval(CHECK_INTERVAL).pipe(
  map(count => {
    const wallet = wallet$.getValue();
    const bridgeBalances = bridgeBalances$.getValue();
    const ethPrice = ethPrice$.getValue();

    return Boolean(count && ethPrice && (!wallet || (wallet && bridgeBalances[SUPPORTED_BRIDGE_NETWORKS[0]])));
  }),
  tap(loaded => bridgeLoaded$.next(loaded)),
  takeWhile(loaded => !loaded),
);

export const [useBridgeLoaded] = bind(bridgeLoaded$, DEFAULT_VALUE);

let subscription: Subscription;

export const subscribeBridgeLoaded = (): void => {
  unsubscribeBridgeLoaded();
  subscription = stream$.subscribe();
};
export const unsubscribeBridgeLoaded = (): void => subscription?.unsubscribe();
export const resetBridgeLoaded = (): void => bridgeLoaded$.next(DEFAULT_VALUE);

subscribeBridgeLoaded();
