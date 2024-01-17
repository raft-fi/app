import { JsonRpcProvider } from 'ethers';
import { bind } from '@react-rxjs/core';
import { Protocol, R_TOKEN } from '@raft-fi/sdk';
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
  combineLatest,
} from 'rxjs';
import { DEBOUNCE_IN_MS, POLLING_INTERVAL_IN_MS } from '../constants';
import { Nullable, ProtocolStats } from '../interfaces';
import { provider$ } from './useProvider';
import { AppEvent, appEvent$ } from './useAppEvent';

export const protocolStats$ = new BehaviorSubject<Nullable<ProtocolStats>>(null);

const intervalBeat$: Observable<number> = interval(POLLING_INTERVAL_IN_MS).pipe(startWith(0));

const fetchData = (provider: JsonRpcProvider) => {
  try {
    const stats = Protocol.getInstance(provider);

    return combineLatest([
      from(stats.fetchCollateralSupply()),
      from(stats.fetchDebtSupply()),
      from(stats.fetchOpenPositionCount()),
      from(stats.fetchTokenTotalSupply(R_TOKEN)),
      from(stats.fetchPsmTvl()),
      from(stats.fetchInterestRate()),
    ]).pipe(
      map(([, , , totalRSupply]) => {
        if (
          !stats.collateralSupply ||
          !stats.debtSupply ||
          (!stats.openPositionCount && stats.openPositionCount !== 0) ||
          !totalRSupply ||
          !stats.psmTvl ||
          !stats.interestRate
        ) {
          return null;
        }

        return {
          collateralSupply: stats.collateralSupply,
          debtSupply: stats.debtSupply,
          openPositions: stats.openPositionCount,
          totalRSupply,
          psmTvlToken: stats.psmTvl.daiLocked,
          psmTvlFiat: stats.psmTvl.usdValue,
          interestRate: stats.interestRate,
        };
      }),
      catchError(error => {
        console.error('useProtocolStats (catchError) - failed to fetch protocol stats', error);
        return of(null);
      }),
    );
  } catch (error) {
    console.error('useProtocolStats (catch) - failed to fetch protocol stats', error);
    return of(null);
  }
};

// Stream that fetches protocol stats periodically
const intervalStream$ = intervalBeat$.pipe(
  withLatestFrom(provider$),
  concatMap<[number, JsonRpcProvider], Observable<Nullable<ProtocolStats>>>(([, provider]) => fetchData(provider)),
);

// fetch when app event fire
const appEventsStream$ = appEvent$.pipe(
  withLatestFrom(provider$),
  filter((value): value is [AppEvent, JsonRpcProvider] => {
    const [event] = value;

    return Boolean(event);
  }),
  concatMap(([, provider]) => {
    return fetchData(provider);
  }),
);

// merge all stream$ into one if there are multiple
const stream$ = merge(intervalStream$, appEventsStream$).pipe(
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

subscribeProtocolStats();
