import { JsonRpcProvider, JsonRpcSigner } from 'ethers';
import { bind } from '@react-rxjs/core';
import { RaftToken } from '@raft-fi/sdk';
import { tap, BehaviorSubject, withLatestFrom, concatMap, Subscription } from 'rxjs';
import { Nullable } from '../interfaces';
import { provider$ } from './useProvider';
import { walletSigner$ } from './useWalletSigner';

export const raftToken$ = new BehaviorSubject<Nullable<RaftToken>>(null);

const fetchData = async (signer: Nullable<JsonRpcSigner>, provider: Nullable<JsonRpcProvider>) => {
  if (!signer || !signer.address || !provider) {
    return null;
  }

  try {
    return new RaftToken(signer.address, provider);
  } catch (error) {
    console.error('useRaftToken - failed to create RaftToken instance', error);
    return null;
  }
};

// Stream that fetches on wallet change
const walletChangeStream$ = walletSigner$.pipe(
  withLatestFrom(provider$),
  concatMap(([walletSigner, provider]) => fetchData(walletSigner, provider)),
);

// merge all stream$ into one if there are multiple
const stream$ = walletChangeStream$.pipe(
  tap(raftToken => {
    raftToken$.next(raftToken);
  }),
);

export const [useRaftToken] = bind(raftToken$, null);

let subscription: Subscription;

export const subscribeRaftToken = (): void => {
  unsubscribeRaftToken();
  subscription = stream$.subscribe();
};
export const unsubscribeRaftToken = (): void => subscription?.unsubscribe();
export const resetRaftToken = (): void => {
  raftToken$.next(null);
};
