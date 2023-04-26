import { bind } from '@react-rxjs/core';
import { BehaviorSubject, Subscription, tap } from 'rxjs';
import { Nullable } from '../interfaces';
import { wallet$ } from './useWallet';

export interface ENS {
  name: Nullable<string>;
  avatar: Nullable<string>;
}

const DEFAULT_VALUE = {
  name: null,
  avatar: null,
};

const ens$ = new BehaviorSubject<ENS>(DEFAULT_VALUE);

const stream$ = wallet$.pipe(
  tap(async wallet => {
    if (!wallet) {
      ens$.next(DEFAULT_VALUE);
      return;
    }

    const accounts = await wallet.listAccounts();

    if (!accounts[0]?.address) {
      ens$.next(DEFAULT_VALUE);
      return;
    }

    const ensName = await wallet.lookupAddress(accounts[0].address);
    const resolver = await wallet.getResolver(ensName ?? '');
    const ensAvatar = await resolver?.getAvatar();

    ens$.next({
      name: ensName ?? null,
      avatar: ensAvatar ?? null,
    });
  }),
);

export const [useENS] = bind<ENS>(ens$, DEFAULT_VALUE);

let subscription: Subscription;

export const subscribeENS = (): void => {
  unsubscribeENS();
  subscription = stream$.subscribe();
};
export const unsubscribeENS = (): void => subscription?.unsubscribe();
export const resetENS = (): void => ens$.next(DEFAULT_VALUE);
