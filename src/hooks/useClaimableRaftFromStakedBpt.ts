import { bind } from '@react-rxjs/core';
import { RaftToken } from '@raft-fi/sdk';
import {
  merge,
  tap,
  filter,
  debounce,
  interval,
  concatMap,
  BehaviorSubject,
  Observable,
  withLatestFrom,
  startWith,
} from 'rxjs';
import { DEBOUNCE_IN_MS, LONG_POLLING_INTERVAL_IN_MS } from '../constants';
import { Nullable } from '../interfaces';
import { appEvent$ } from './useAppEvent';
import { Decimal } from '@tempusfinance/decimal';
import { raftToken$ } from './useRaftToken';

const claimableRaft$ = new BehaviorSubject<Nullable<Decimal>>(null);

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

// only poll once per hour
const intervalBeat$: Observable<number> = interval(LONG_POLLING_INTERVAL_IN_MS).pipe(startWith(0));

// Stream that fetches protocol stats periodically
const intervalStream$ = intervalBeat$.pipe(
  withLatestFrom(raftToken$),
  concatMap(([, raftToken]) => fetchData(raftToken)),
);

// fetch when raft token changed
const raftTokenStream$ = raftToken$.pipe(concatMap(raftToken => fetchData(raftToken)));

// fetch when app event fire
const appEventsStream$ = appEvent$.pipe(
  withLatestFrom(raftToken$),
  filter(([appEvent]) => appEvent?.eventType === 'stake-claim'),
  concatMap(([, raftToken]) => fetchData(raftToken)),
);

// merge all stream$ into one if there are multiple
const stream$ = merge(intervalStream$, raftTokenStream$, appEventsStream$).pipe(
  filter(claimableRaft => Boolean(claimableRaft)),
  debounce<Nullable<Decimal>>(() => interval(DEBOUNCE_IN_MS)),
  tap(claimableRaft => claimableRaft$.next(claimableRaft)),
);

// serve last cached data, and meanwhile request to fetch new
const hook$ = merge(claimableRaft$, stream$);

// only fetch data when hook is used
export const [useClaimableRaftFromStakedBpt] = bind(hook$, null);
