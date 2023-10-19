import { RaftToken, StakingTransaction } from '@raft-fi/sdk';
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

const DEFAULT_VALUE: StakingTransaction[] = [];

export const stakingTransactions$ = new BehaviorSubject<StakingTransaction[]>(DEFAULT_VALUE);

const fetchData = async (raftToken: Nullable<RaftToken>) => {
  try {
    if (!raftToken) {
      return [];
    }

    return await raftToken.getStakingTransactions();
  } catch (error) {
    console.error('useStakingTransaction (error) - failed to fetch staking transactions', error);
    return [];
  }
};

const intervalBeat$: Observable<number> = interval(POLLING_INTERVAL_IN_MS).pipe(startWith(0));

// stream$ for periodic polling to fetch data
const periodicStream$: Observable<StakingTransaction[]> = combineLatest([intervalBeat$, raftToken$]).pipe(
  mergeMap<[number, Nullable<RaftToken>], Promise<StakingTransaction[]>>(([, raftToken]) => fetchData(raftToken)),
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

const stream$: Observable<StakingTransaction[]> = merge(periodicStream$, appEventsStream$).pipe(
  tap(stakingTransactions => stakingTransactions$.next(stakingTransactions)),
);

export const [useStakingTransactions] = bind(stakingTransactions$, DEFAULT_VALUE);

let subscription: Subscription;

export const subscribeStakingTransactions = (): void => {
  unsubscribeStakingTransactions();
  subscription = stream$.subscribe();
};
export const unsubscribeStakingTransactions = (): void => subscription?.unsubscribe();
export const resetStakingTransactions = (): void => {
  stakingTransactions$.next(DEFAULT_VALUE);
};

subscribeStakingTransactions();
