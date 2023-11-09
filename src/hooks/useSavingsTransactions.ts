import { JsonRpcSigner } from 'ethers';
import { SavingsTransaction, UserSavings } from '@raft-fi/sdk';
import { merge, tap, filter, concatMap, distinctUntilChanged, BehaviorSubject } from 'rxjs';
import { Nullable } from '../interfaces';
import { walletSigner$ } from './useWalletSigner';

const rawSavingsTransactions$ = new BehaviorSubject<SavingsTransaction[]>([]);

const fetchData = async (walletSigner: Nullable<JsonRpcSigner>) => {
  if (!walletSigner) {
    return [];
  }

  try {
    const userSavings = new UserSavings(walletSigner);

    return await userSavings.getSavingsTransactions();
  } catch (error) {
    console.error('useSavingsTransactions - failed to fetch savings transactions', error);
    return [];
  }
};

// Stream that fetches on wallet change
const walletChangeStream$ = walletSigner$.pipe(concatMap(walletSigner => fetchData(walletSigner)));

// merge all stream$ into one if there are multiple
const stream$ = merge(walletChangeStream$).pipe(
  filter((transactions): transactions is SavingsTransaction[] => Boolean(transactions)),
  tap(transactions => rawSavingsTransactions$.next(transactions)),
);

// serve last cached data, and meanwhile request to fetch new
export const savingsTransactions$ = merge(rawSavingsTransactions$, stream$).pipe(
  distinctUntilChanged((prev, curr) => prev[0]?.id === curr[0]?.id),
);
