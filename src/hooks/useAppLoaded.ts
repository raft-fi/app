import { bind } from '@react-rxjs/core';
import { BehaviorSubject, Subscription, interval, map, tap, takeWhile } from 'rxjs';
import { collateralBalance$ } from './useCollateralBalance';
import { debtBalance$ } from './useDebtBalance';
import { wallet$ } from './useWallet';

const DEFAULT_VALUE = false;
const CHECK_INTERVAL = 1000;

const appLoaded$ = new BehaviorSubject<boolean>(DEFAULT_VALUE);

const stream$ = interval(CHECK_INTERVAL).pipe(
  map(count => {
    const wallet = wallet$.getValue();
    const collateralBalance = collateralBalance$.getValue();
    const debtBalance = debtBalance$.getValue();

    return Boolean(count && (!wallet || (wallet && collateralBalance && debtBalance)));
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
