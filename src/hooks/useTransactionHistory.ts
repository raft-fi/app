import { bind } from '@react-rxjs/core';
import { BridgeRequestTransaction, PositionTransaction, SavingsTransaction } from '@raft-fi/sdk';
import { tap, filter, debounce, interval, Subscription, BehaviorSubject, combineLatest } from 'rxjs';
import { DEBOUNCE_IN_MS } from '../constants';
import { Nullable } from '../interfaces';
import { manageTransactions$ } from './useManageTransactions';
import { savingsTransactions$ } from './useSavingsTransactions';
import { bridgeRequestTransactions$ } from './useBridgeRequestTransactions';

export type HistoryTransaction = PositionTransaction | SavingsTransaction | BridgeRequestTransaction;

const transactionHistory$ = new BehaviorSubject<Nullable<HistoryTransaction[]>>(null);

// merge all stream$ into one if there are multiple
const stream$ = combineLatest([manageTransactions$, savingsTransactions$, bridgeRequestTransactions$]).pipe(
  filter((transactions): transactions is [PositionTransaction[], SavingsTransaction[], BridgeRequestTransaction[]] => {
    const [positionTransactions, savingsTransactions, bridgeRequestTransactions] = transactions;

    return Boolean(positionTransactions && savingsTransactions && bridgeRequestTransactions);
  }),
  debounce<[PositionTransaction[], SavingsTransaction[], BridgeRequestTransaction[]]>(() => interval(DEBOUNCE_IN_MS)),
  tap(transactions => {
    const manageTransactions = transactions[0];
    const savingsTransactions = transactions[1];
    const bridgeRequestTransactions = transactions[2];

    const result: HistoryTransaction[] = [
      ...manageTransactions,
      ...savingsTransactions,
      ...bridgeRequestTransactions,
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
