import { bind } from '@react-rxjs/core';
import { BehaviorSubject, Subscription, interval, map, tap, takeWhile } from 'rxjs';
import { wallet$ } from './useWallet';
import { collateralBorrowingRate$ } from './useCollateralBorrowingRate';
import { protocolStats$ } from './useProtocolStats';
import { position$ } from './usePosition';

const DEFAULT_VALUE = false;
const CHECK_INTERVAL = 1000;

const appLoaded$ = new BehaviorSubject<boolean>(DEFAULT_VALUE);

const stream$ = interval(CHECK_INTERVAL).pipe(
  map(count => {
    const wallet = wallet$.getValue();
    const position = position$.getValue();
    const borrowingRate = collateralBorrowingRate$.getValue();
    const protocolStats = protocolStats$.getValue();

    return Boolean(count && borrowingRate && protocolStats?.debtSupply && (!wallet || (wallet && position)));
  }),
  tap(loaded => appLoaded$.next(loaded)),
  takeWhile(loaded => !loaded),
);

export const [useAppLoaded] = bind(appLoaded$, DEFAULT_VALUE);

let subscription: Subscription;

export const subscribeAppLoaded = (): void => {
  unsubscribeAppLoaded();
  subscription = stream$.subscribe();
};
export const unsubscribeAppLoaded = (): void => subscription?.unsubscribe();
export const resetAppLoaded = (): void => appLoaded$.next(DEFAULT_VALUE);
