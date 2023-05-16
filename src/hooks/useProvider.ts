import { JsonRpcProvider } from 'ethers';
import { tap, BehaviorSubject } from 'rxjs';
import { config$ } from './useConfig';

const defaultRpcUrl = import.meta.env.VITE_GOERLI_RPC_URL;

// TODO - Select RPC URL based on current user network (or use default if wallet is not connected)
const DEFAULT_VALUE = new JsonRpcProvider(defaultRpcUrl);

export const provider$ = new BehaviorSubject(DEFAULT_VALUE);

const stream$ = config$.pipe(
  tap(config => {
    provider$.next(new JsonRpcProvider(config.rpcUrl));
  }),
);
stream$.subscribe();
