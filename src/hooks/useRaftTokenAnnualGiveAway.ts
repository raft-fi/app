import { RaftToken } from '@raft-fi/sdk';
import { Decimal } from '@tempusfinance/decimal';
import { bind } from '@react-rxjs/core';
import { tap, Subscription, BehaviorSubject, map } from 'rxjs';
import { Nullable } from '../interfaces';
import { raftToken$ } from './useRaftToken';

const DEFAULT_VALUE: Nullable<Decimal> = null;

export const annualGiveAway$ = new BehaviorSubject<Nullable<Decimal>>(DEFAULT_VALUE);

const raftTokenStream$ = raftToken$.pipe(
  map<Nullable<RaftToken>, Nullable<Decimal>>(raftToken => raftToken?.getAnnualGiveAway() ?? null),
);

const stream$ = raftTokenStream$.pipe(tap(annualGiveAway => annualGiveAway$.next(annualGiveAway)));

export const [useRaftTokenAnnualGiveAway] = bind(annualGiveAway$, DEFAULT_VALUE);

let subscription: Subscription;

export const subscribeRaftTokenAnnualGiveAway = (): void => {
  unsubscribeRaftTokenAnnualGiveAway();
  subscription = stream$.subscribe();
};
export const unsubscribeRaftTokenAnnualGiveAway = (): void => subscription?.unsubscribe();
export const resetRaftTokenAnnualGiveAway = (): void => {
  annualGiveAway$.next(DEFAULT_VALUE);
};
