import { RaftToken } from '@raft-fi/sdk';
import { bind } from '@react-rxjs/core';
import { Decimal } from '@tempusfinance/decimal';
import { tap, Observable, interval, Subscription, BehaviorSubject, combineLatest, startWith, mergeMap } from 'rxjs';
import { POLLING_INTERVAL_IN_MS } from '../constants';
import { Nullable } from '../interfaces';
import { raftToken$ } from './useRaftToken';

const DEFAULT_VALUE: Nullable<Decimal> = null;

export const userRaftBptBalance$ = new BehaviorSubject<Nullable<Decimal>>(DEFAULT_VALUE);

const fetchData = async (raftToken: Nullable<RaftToken>) => {
  try {
    if (!raftToken) {
      return null;
    }

    return await raftToken.getUserBptBalance();
  } catch (error) {
    console.error('useUserRaftBptBalance (error) - failed to fetch RAFT BPT balance', error);
    return null;
  }
};

const intervalBeat$: Observable<number> = interval(POLLING_INTERVAL_IN_MS).pipe(startWith(0));

const stream$: Observable<Nullable<Decimal>> = combineLatest([intervalBeat$, raftToken$]).pipe(
  mergeMap<[number, Nullable<RaftToken>], Promise<Nullable<Decimal>>>(([, raftToken]) => fetchData(raftToken)),
  tap(userRaftBptBalance => userRaftBptBalance$.next(userRaftBptBalance)),
);

export const [useUserRaftBptBalance] = bind(userRaftBptBalance$, DEFAULT_VALUE);

let subscription: Subscription;

export const subscribeUserRaftBptBalance = (): void => {
  unsubscribeUserRaftBptBalance();
  subscription = stream$.subscribe();
};
export const unsubscribeUserRaftBptBalance = (): void => subscription?.unsubscribe();
export const resetUserRaftBptBalance = (): void => {
  userRaftBptBalance$.next(DEFAULT_VALUE);
};
