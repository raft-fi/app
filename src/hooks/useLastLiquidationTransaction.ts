import { bind } from '@react-rxjs/core';
import { PositionTransaction } from '@raft-fi/sdk';
import { tap, map, merge, distinctUntilChanged, BehaviorSubject } from 'rxjs';
import { Nullable } from '../interfaces';
import { manageTransactions$ } from './useManageTransactions';

const lastLiquidationTransaction$ = new BehaviorSubject<Nullable<PositionTransaction>>(null);

const stream$ = manageTransactions$.pipe(
  map(transactions => (transactions ?? []).filter(transaction => transaction.type === 'LIQUIDATION')[0] ?? null),
  tap(transaction => lastLiquidationTransaction$.next(transaction)),
);

// serve last cached data, and meanwhile request to fetch new
const hook$ = merge(lastLiquidationTransaction$, stream$).pipe(
  distinctUntilChanged((prev, curr) => prev?.id === curr?.id),
);

// only fetch data when hook is used
export const [useLastLiquidationTransaction] = bind(hook$, null);
