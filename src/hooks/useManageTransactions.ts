import { JsonRpcSigner } from 'ethers';
import { PositionTransaction, UserPosition } from '@raft-fi/sdk';
import { merge, tap, filter, concatMap, distinctUntilChanged, BehaviorSubject } from 'rxjs';
import { SUPPORTED_UNDERLYING_TOKENS } from '../constants';
import { Nullable } from '../interfaces';
import { walletSigner$ } from './useWalletSigner';

const rawManageTransactions$ = new BehaviorSubject<PositionTransaction[]>([]);

const fetchData = async (walletSigner: Nullable<JsonRpcSigner>) => {
  if (!walletSigner) {
    return [];
  }

  try {
    const dummyUnderlyingToken = SUPPORTED_UNDERLYING_TOKENS[0];

    const userPosition = new UserPosition(walletSigner, dummyUnderlyingToken);

    return await userPosition.getTransactions();
  } catch (error) {
    console.error('useManageTransactions - failed to fetch manage transactions', error);
    return [];
  }
};

// Stream that fetches on wallet change
const walletChangeStream$ = walletSigner$.pipe(concatMap(walletSigner => fetchData(walletSigner)));

// merge all stream$ into one if there are multiple
const stream$ = merge(walletChangeStream$).pipe(
  filter((transactions): transactions is PositionTransaction[] => Boolean(transactions)),
  tap(transactions => rawManageTransactions$.next(transactions)),
);

// serve last cached data, and meanwhile request to fetch new
export const manageTransactions$ = merge(rawManageTransactions$, stream$).pipe(
  distinctUntilChanged((prev, curr) => prev[0]?.id === curr[0]?.id),
);
