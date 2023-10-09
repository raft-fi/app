import { RaftToken } from '@raft-fi/sdk';
import { bind } from '@react-rxjs/core';
import { Decimal } from '@tempusfinance/decimal';
import { tap, Observable, interval, Subscription, BehaviorSubject, combineLatest, startWith, mergeMap } from 'rxjs';
import { POLLING_INTERVAL_IN_MS } from '../constants';
import { Nullable } from '../interfaces';
import { raftToken$ } from './useRaftToken';
import { isWrongNetwork$ } from './useNetwork';

const DEFAULT_VALUE: Nullable<Decimal> = null;

export const totalVeRaftAnnualShare$ = new BehaviorSubject<Nullable<Decimal>>(DEFAULT_VALUE);

const fetchData = async (raftToken: Nullable<RaftToken>) => {
  try {
    if (!raftToken) {
      return null;
    }

    return await raftToken.calculateTotalVeRaftAnnualShare();
  } catch (error) {
    console.error('useTotalVeRaftAnnualShare (error) - failed to fetch total veRAFT annual share', error);
    return null;
  }
};

const intervalBeat$: Observable<number> = interval(POLLING_INTERVAL_IN_MS).pipe(startWith(0));

const stream$: Observable<Nullable<Decimal>> = combineLatest([intervalBeat$, raftToken$, isWrongNetwork$]).pipe(
  mergeMap<[number, Nullable<RaftToken>, boolean], Promise<Nullable<Decimal>>>(([, raftToken, isWrongNetwork]) => {
    if (isWrongNetwork) {
      return Promise.resolve(DEFAULT_VALUE);
    }

    return fetchData(raftToken);
  }),
  tap(totalVeRaftAnnualShare => totalVeRaftAnnualShare$.next(totalVeRaftAnnualShare)),
);

export const [useTotalVeRaftAnnualShare] = bind(totalVeRaftAnnualShare$, DEFAULT_VALUE);

let subscription: Subscription;

export const subscribeTotalVeRaftAnnualShare = (): void => {
  unsubscribeTotalVeRaftAnnualShare();
  subscription = stream$.subscribe();
};
export const unsubscribeTotalVeRaftAnnualShare = (): void => subscription?.unsubscribe();
export const resetTotalVeRaftAnnualShare = (): void => {
  totalVeRaftAnnualShare$.next(DEFAULT_VALUE);
};

subscribeTotalVeRaftAnnualShare();
