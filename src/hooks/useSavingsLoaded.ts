import { bind } from '@react-rxjs/core';
import { BehaviorSubject, Subscription, interval, map, tap, takeWhile } from 'rxjs';
import { wallet$ } from './useWallet';
import { savingsMaxDeposit$ } from './useSavingsMaxDeposit';
import { currentUserSavings$ } from './useCurrentUserSavings';
import { currentSavingsNetwork$ } from './useCurrentSavingsNetwork';
import { savingsTokenBalance$ } from './useSavingsTokenBalance';
import { savingsStats$ } from './useSavingsStats';

const DEFAULT_VALUE = false;
const CHECK_INTERVAL = 1000;

const savingsLoaded$ = new BehaviorSubject<boolean>(DEFAULT_VALUE);

const stream$ = interval(CHECK_INTERVAL).pipe(
  map(count => {
    const wallet = wallet$.getValue();
    const savingsStats = savingsStats$.getValue();
    const savingsMaxDeposit = savingsMaxDeposit$.getValue();
    const savingsTokenBalance = savingsTokenBalance$.getValue();
    const currentUserSavings = currentUserSavings$.getValue();
    const currentSavingsNetwork = currentSavingsNetwork$.getValue();

    return Boolean(
      count &&
        savingsMaxDeposit &&
        savingsStats[currentSavingsNetwork].currentYield &&
        savingsStats[currentSavingsNetwork].tvl &&
        savingsStats[currentSavingsNetwork].yieldReserve &&
        (!wallet || (wallet && savingsTokenBalance && currentUserSavings)),
    );
  }),
  tap(loaded => savingsLoaded$.next(loaded)),
  takeWhile(loaded => !loaded),
);

export const [useSavingsLoaded] = bind(savingsLoaded$, DEFAULT_VALUE);

let subscription: Subscription;

export const subscribeSavingsLoaded = (): void => {
  unsubscribeSavingsLoaded();
  subscription = stream$.subscribe();
};
export const unsubscribeSavingsLoaded = (): void => subscription?.unsubscribe();
export const resetSavingsLoaded = (): void => savingsLoaded$.next(DEFAULT_VALUE);

subscribeSavingsLoaded();
