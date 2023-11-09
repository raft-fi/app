import { RaftToken, StakingTransaction } from '@raft-fi/sdk';
import { tap, BehaviorSubject, filter, merge, concatMap, distinctUntilChanged } from 'rxjs';
import { Nullable } from '../interfaces';
import { raftToken$ } from './useRaftToken';

const rawStakingTransactions$ = new BehaviorSubject<StakingTransaction[]>([]);

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

// Stream that fetches on Raft Token change
const raftTokenChangeStream$ = raftToken$.pipe(concatMap(walletSigner => fetchData(walletSigner)));

// merge all stream$ into one if there are multiple
const stream$ = merge(raftTokenChangeStream$).pipe(
  filter((transactions): transactions is StakingTransaction[] => Boolean(transactions)),
  tap(transactions => rawStakingTransactions$.next(transactions)),
);

// serve last cached data, and meanwhile request to fetch new
export const stakingTransactions$ = merge(rawStakingTransactions$, stream$).pipe(
  distinctUntilChanged((prev, curr) => prev[0]?.id === curr[0]?.id),
);
