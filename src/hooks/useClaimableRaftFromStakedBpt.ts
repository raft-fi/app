import { bind } from '@react-rxjs/core';
import { RaftToken } from '@raft-fi/sdk';
import {
  merge,
  tap,
  filter,
  Observable,
  debounce,
  interval,
  Subscription,
  concatMap,
  BehaviorSubject,
  startWith,
  withLatestFrom,
} from 'rxjs';
import { DEBOUNCE_IN_MS, POLLING_INTERVAL_IN_MS } from '../constants';
import { Nullable } from '../interfaces';
import { appEvent$ } from './useAppEvent';
import { Decimal } from '@tempusfinance/decimal';
import { raftToken$ } from './useRaftToken';

export const claimableRaft$ = new BehaviorSubject<Nullable<Decimal>>(null);

const intervalBeat$: Observable<number> = interval(POLLING_INTERVAL_IN_MS).pipe(startWith(0));

const fetchData = async (raftToken: Nullable<RaftToken>) => {
  try {
    if (!raftToken) {
      return null;
    }

    return raftToken.getClaimableRaftFromStakedBpt();
  } catch (error) {
    console.error('useClaimableRaftFromStakedBpt (catch) - failed to fetch claimable Raft', error);
    return null;
  }
};

// Stream that fetches protocol stats periodically
const intervalStream$ = intervalBeat$.pipe(
  withLatestFrom(raftToken$),
  concatMap(([, raftToken]) => fetchData(raftToken)),
);

// fetch when app event fire
const appEventsStream$ = appEvent$.pipe(
  withLatestFrom(raftToken$),
  concatMap(([, raftToken]) => fetchData(raftToken)),
);

// merge all stream$ into one if there are multiple
const stream$ = merge(intervalStream$, appEventsStream$).pipe(
  filter(claimableRaft => Boolean(claimableRaft)),
  debounce<Nullable<Decimal>>(() => interval(DEBOUNCE_IN_MS)),
  tap(claimableRaft => {
    claimableRaft$.next(claimableRaft);
  }),
);

export const [useClaimableRaftFromStakedBpt] = bind(claimableRaft$, null);

let subscription: Subscription;

export const subscribeClaimableRaftFromStakedBpt = (): void => {
  unsubscribeClaimableRaftFromStakedBpt();
  subscription = stream$.subscribe();
};
export const unsubscribeClaimableRaftFromStakedBpt = (): void => subscription?.unsubscribe();
export const resetClaimableRaftFromStakedBpt = (): void => {
  claimableRaft$.next(null);
};

subscribeClaimableRaftFromStakedBpt();
