import { bind } from '@react-rxjs/core';
import { BehaviorSubject, Subscription, interval, map, tap, takeWhile } from 'rxjs';
import { wallet$ } from './useWallet';
import { userVeRaftBalance$ } from './useUserVeRaftBalance';

const DEFAULT_VALUE = false;
const CHECK_INTERVAL = 1000;

const stakeLoaded$ = new BehaviorSubject<boolean>(DEFAULT_VALUE);

const stream$ = interval(CHECK_INTERVAL).pipe(
  map(count => {
    const wallet = wallet$.getValue();
    const userVeRaftBalance = userVeRaftBalance$.getValue();

    return Boolean(count && (!wallet || (wallet && userVeRaftBalance)));
  }),
  tap(loaded => stakeLoaded$.next(loaded)),
  takeWhile(loaded => !loaded),
);

export const [useStakeLoaded] = bind(stakeLoaded$, DEFAULT_VALUE);

let subscription: Subscription;

export const subscribeStakeLoaded = (): void => {
  unsubscribeStakeLoaded();
  subscription = stream$.subscribe();
};
export const unsubscribeStakeLoaded = (): void => subscription?.unsubscribe();
export const resetStakeLoaded = (): void => stakeLoaded$.next(DEFAULT_VALUE);

subscribeStakeLoaded();