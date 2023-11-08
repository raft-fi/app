import { bind } from '@react-rxjs/core';
import { BehaviorSubject, concatMap, tap, Subscription } from 'rxjs';
import { Decimal } from '@tempusfinance/decimal';
import { Nullable } from '../interfaces';
import { RaftToken } from '@raft-fi/sdk';
import { YEAR_IN_MS } from '../constants';
import { raftToken$ } from './useRaftToken';

const DEFAULT_VALUE: Nullable<Decimal> = null;
const BPT_AMOUNT = new Decimal(10000);

export const maxStakingApr$ = new BehaviorSubject<Nullable<Decimal>>(DEFAULT_VALUE);

const fetchData = async (raftToken: Nullable<RaftToken>): Promise<Nullable<Decimal>> => {
  try {
    if (!raftToken) {
      return null;
    }

    const now = Date.now();
    const maxLockTime = new Date(now + 2 * YEAR_IN_MS);

    return raftToken.estimateStakingApr(BPT_AMOUNT, maxLockTime);
  } catch (error) {
    console.error('useMaxStakingApr - Fail to get token price for ETH', error);
    return null;
  }
};

const stream$ = raftToken$.pipe(
  concatMap(raftToken => fetchData(raftToken)),
  tap(apr => maxStakingApr$.next(apr)),
);

export const [useMaxStakingApr] = bind(maxStakingApr$, DEFAULT_VALUE);

let subscription: Subscription;

export const subscribeMaxStakingApr = (): void => {
  unsubscribeMaxStakingApr();
  subscription = stream$.subscribe();
};
export const unsubscribeMaxStakingApr = (): void => subscription?.unsubscribe?.();
export const resetMaxStakingApr = (): void => maxStakingApr$.next(DEFAULT_VALUE);

subscribeMaxStakingApr();
