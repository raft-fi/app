import { JsonRpcProvider } from 'ethers';
import { bind } from '@react-rxjs/core';
import { Stats } from '@raft-fi/sdk';
import {
  from,
  of,
  merge,
  tap,
  filter,
  Observable,
  catchError,
  debounce,
  interval,
  Subscription,
  concatMap,
  BehaviorSubject,
  startWith,
  withLatestFrom,
  map,
} from 'rxjs';
import { DEBOUNCE_IN_MS, POLLING_INTERVAL_IN_MS } from '../constants';
import { Nullable, ProtocolStats } from '../interfaces';
import { provider$ } from './useProvider';

const protocolStats$ = new BehaviorSubject<Nullable<ProtocolStats>>(null);

const intervalBeat$: Observable<number> = interval(POLLING_INTERVAL_IN_MS).pipe(startWith(0));

// Stream that fetches protocol stats periodically
const intervalStream$ = intervalBeat$.pipe(
  withLatestFrom(provider$),
  concatMap<[number, JsonRpcProvider], Observable<Nullable<ProtocolStats>>>(([, provider]) => {
    try {
      const stats = Stats.getInstance(provider);

      return from(stats.fetch()).pipe(
        map(() => {
          if (!stats.collateralSupply || !stats.debtSupply || !stats.borrowingRate) {
            return null;
          }

          return {
            collateralSupply: stats.collateralSupply,
            debtSupply: stats.debtSupply,
            borrowingRate: stats.borrowingRate,
          };
        }),
        catchError(error => {
          console.error('useProtocolStats - failed to fetch protocol stats', error);
          return of(null);
        }),
      );
    } catch (error) {
      console.error('useProtocolStats - failed to fetch protocol stats', error);
      return of(null);
    }
  }),
);

// merge all stream$ into one if there are multiple
const stream$ = merge(intervalStream$).pipe(
  filter((protocolStats): protocolStats is ProtocolStats => Boolean(protocolStats)),
  debounce<ProtocolStats>(() => interval(DEBOUNCE_IN_MS)),
  tap(protocolStats => {
    protocolStats$.next(protocolStats);
  }),
);

export const [useProtocolStats] = bind(protocolStats$, null);

let subscription: Subscription;

export const subscribeProtocolStats = (): void => {
  unsubscribeProtocolStats();
  subscription = stream$.subscribe();
};
export const unsubscribeProtocolStats = (): void => subscription?.unsubscribe();
export const resetProtocolStats = (): void => {
  protocolStats$.next(null);
};
