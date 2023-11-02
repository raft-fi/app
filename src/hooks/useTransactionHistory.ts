import { bind } from '@react-rxjs/core';
import { BridgeRequestTransaction, PositionTransaction, SavingsTransaction, StakingTransaction } from '@raft-fi/sdk';
import { tap, filter, debounce, interval, Subscription, BehaviorSubject, combineLatest } from 'rxjs';
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
  tap(transactions => {
    const manageTransactions = transactions[0];
    const savingsTransactions = transactions[1];
    const bridgeRequestTransactions = transactions[2];
    const stakingTransactions = transactions[3];

    const result: HistoryTransaction[] = [
      ...manageTransactions,
      ...savingsTransactions,
      ...bridgeRequestTransactions,
      ...stakingTransactions,
    ].sort((a, b) => {
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

    transactionHistory$.next(result);
  }),
);

export const [useTransactionHistory] = bind(transactionHistory$, null);

let subscription: Subscription;

export const subscribeTransactionHistory = (): void => {
  unsubscribeTransactionHistory();
  subscription = stream$.subscribe();
};
export const unsubscribeTransactionHistory = (): void => subscription?.unsubscribe();
export const resetTransactionHistory = (): void => {
  transactionHistory$.next(null);
};
