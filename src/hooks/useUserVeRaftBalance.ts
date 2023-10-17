import { RaftToken, UserVeRaftBalance } from '@raft-fi/sdk';
import { bind } from '@react-rxjs/core';
import {
  tap,
  Observable,
  interval,
  Subscription,
  BehaviorSubject,
  combineLatest,
  startWith,
  mergeMap,
  withLatestFrom,
  filter,
  merge,
} from 'rxjs';
import { POLLING_INTERVAL_IN_MS } from '../constants';
import { Nullable } from '../interfaces';
import { AppEvent, appEvent$ } from './useAppEvent';
import { raftToken$ } from './useRaftToken';

const DEFAULT_VALUE: Nullable<UserVeRaftBalance> = null;

export const userVeRaftBalance$ = new BehaviorSubject<Nullable<UserVeRaftBalance>>(DEFAULT_VALUE);

const fetchData = async (raftToken: Nullable<RaftToken>) => {
  try {
    if (!raftToken) {
      return null;
    }

    return await raftToken.getUserVeRaftBalance();
  } catch (error) {
    console.error('useUserVeRaftBalance (error) - failed to fetch veRAFT balance', error);
    return null;
  }
};

const intervalBeat$: Observable<number> = interval(POLLING_INTERVAL_IN_MS).pipe(startWith(0));

// stream$ for periodic polling to fetch data
const periodicStream$: Observable<Nullable<UserVeRaftBalance>> = combineLatest([intervalBeat$, raftToken$]).pipe(
  mergeMap<[number, Nullable<RaftToken>], Promise<Nullable<UserVeRaftBalance>>>(([, raftToken]) =>
    fetchData(raftToken),
  ),
);

// fetch when app event fire
const appEventsStream$ = appEvent$.pipe(
  withLatestFrom(raftToken$),
  filter((value): value is [AppEvent, Nullable<RaftToken>] => {
    const [appEvent, raftToken] = value;

    return (
      Boolean(raftToken) &&
      Boolean(appEvent?.eventType) &&
      ['stake-new', 'stake-increase', 'stake-extend', 'stake-increase-extend'].includes(appEvent?.eventType as string)
    );
  }),
  mergeMap(([, raftToken]) => fetchData(raftToken)),
);

const stream$: Observable<Nullable<UserVeRaftBalance>> = merge(periodicStream$, appEventsStream$).pipe(
  tap(userVeRaftBalance => userVeRaftBalance$.next(userVeRaftBalance)),
);

export const [useUserVeRaftBalance] = bind(userVeRaftBalance$, DEFAULT_VALUE);

let subscription: Subscription;

export const subscribeUserVeRaftBalance = (): void => {
  unsubscribeUserVeRaftBalance();
  subscription = stream$.subscribe();
};
export const unsubscribeUserVeRaftBalance = (): void => subscription?.unsubscribe();
export const resetUserVeRaftBalance = (): void => {
  userVeRaftBalance$.next(DEFAULT_VALUE);
};
