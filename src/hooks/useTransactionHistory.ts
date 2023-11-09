import { bind } from '@react-rxjs/core';
import { BridgeRequestTransaction, PositionTransaction, SavingsTransaction, StakingTransaction } from '@raft-fi/sdk';
import { map, tap, merge, filter, debounce, interval, BehaviorSubject, combineLatest } from 'rxjs';
import { DEBOUNCE_IN_MS } from '../constants';
import { Nullable } from '../interfaces';
import { manageTransactions$ } from './useManageTransactions';
import { savingsTransactions$ } from './useSavingsTransactions';
import { stakingTransactions$ } from './useStakingTransactions';
import { bridgeRequestTransactions$ } from './useBridgeRequestTransactions';

export type HistoryTransaction =
  | PositionTransaction
  | SavingsTransaction
  | BridgeRequestTransaction
  | StakingTransaction;

const transactionHistory$ = new BehaviorSubject<Nullable<HistoryTransaction[]>>(null);

// merge all stream$ into one if there are multiple
const stream$ = combineLatest([
  manageTransactions$,
  savingsTransactions$,
  bridgeRequestTransactions$,
  stakingTransactions$,
]).pipe(
  filter(
    (
      transactions,
    ): transactions is [
      PositionTransaction[],
      SavingsTransaction[],
      BridgeRequestTransaction[],
      StakingTransaction[],
    ] => {
      const [positionTransactions, savingsTransactions, bridgeRequestTransactions, stakingTransactions] = transactions;

      return Boolean(positionTransactions && savingsTransactions && bridgeRequestTransactions && stakingTransactions);
    },
  ),
  debounce<[PositionTransaction[], SavingsTransaction[], BridgeRequestTransaction[], StakingTransaction[]]>(() =>
    interval(DEBOUNCE_IN_MS),
  ),
  map(transactions => {
    const manageTransactions = transactions[0];
    const savingsTransactions = transactions[1];
    const bridgeRequestTransactions = transactions[2];
    const stakingTransactions = transactions[3];

    const result: HistoryTransaction[] = [
      ...manageTransactions,
      ...savingsTransactions,
      ...bridgeRequestTransactions,
      ...stakingTransactions,
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return result;
  }),
  tap(transactions => transactionHistory$.next(transactions)),
);

// serve last cached data, and meanwhile request to fetch new
const hook$ = merge(transactionHistory$, stream$);

// only fetch data when hook is used
export const [useTransactionHistory] = bind(hook$, null);
