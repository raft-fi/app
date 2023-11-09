import { Protocol } from '@raft-fi/sdk';
import { Decimal } from '@tempusfinance/decimal';
import { bind } from '@react-rxjs/core';
import {
  from,
  of,
  tap,
  Observable,
  catchError,
  interval,
  Subscription,
  BehaviorSubject,
  withLatestFrom,
  startWith,
  mergeMap,
} from 'rxjs';
import { JsonRpcProvider } from 'ethers';
import { LONG_POLLING_INTERVAL_IN_MS } from '../constants';
import { Nullable } from '../interfaces';
import { provider$ } from './useProvider';

const DEFAULT_VALUE: Nullable<Decimal> = null;

export const rFlashMintFee$ = new BehaviorSubject<Nullable<Decimal>>(DEFAULT_VALUE);

const fetchData = (provider: JsonRpcProvider) => {
  try {
    const stats = Protocol.getInstance(provider);

    return from(stats.fetchFlashMintFee()).pipe(
      catchError(error => {
        console.error('useRFlashMintFee (catchError) - failed to fetch flash mint fee', error);
        return of(DEFAULT_VALUE);
      }),
    );
  } catch (error) {
    console.error('useRFlashMintFee (error) - failed to fetch flash mint fee', error);
    return of(DEFAULT_VALUE);
  }
};

// only poll once per hour
const intervalBeat$: Observable<number> = interval(LONG_POLLING_INTERVAL_IN_MS).pipe(startWith(0));

// stream$ for periodic polling to fetch data
const periodicStream$: Observable<Nullable<Decimal>> = intervalBeat$.pipe(
  withLatestFrom(provider$),
  mergeMap<[number, JsonRpcProvider], Observable<Nullable<Decimal>>>(([, provider]) => fetchData(provider)),
);

const stream$ = periodicStream$.pipe(tap(rFlashMintFee => rFlashMintFee$.next(rFlashMintFee)));

export const [useRFlashMintFee] = bind(rFlashMintFee$, DEFAULT_VALUE);

let subscription: Subscription;

export const subscribeRFlashMintFee = (): void => {
  unsubscribeRFlashMintFee();
  subscription = stream$.subscribe();
};
export const unsubscribeRFlashMintFee = (): void => subscription?.unsubscribe();
export const resetRFlashMintFee = (): void => {
  rFlashMintFee$.next(DEFAULT_VALUE);
};
