import { bind } from '@react-rxjs/core';
import { interval, BehaviorSubject, Observable, startWith, mergeMap, tap, Subscription } from 'rxjs';
import axios from 'axios';
import { Decimal } from '@tempusfinance/decimal';
import { POLLING_INTERVAL_IN_MS } from '../constants';
import { Nullable } from '../interfaces';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd';

const DEFAULT_VALUE: Nullable<Decimal> = null;

const intervalBeat$: Observable<number> = interval(POLLING_INTERVAL_IN_MS).pipe(startWith(0));

export const ethPrice$ = new BehaviorSubject<Nullable<Decimal>>(DEFAULT_VALUE);

const fetchData = async (): Promise<Nullable<Decimal>> => {
  try {
    // price feed for ETH is not available on SDK and contract/subgraph, use coingecko at this moment
    const response = await axios.get(COINGECKO_API_URL);

    return new Decimal(response.data.ethereum.usd);
  } catch (error) {
    console.error('useEthPrice - Fail to get token price for ETH', error);
    return null;
  }
};

// stream$ for periodic polling to fetch data
const stream$ = intervalBeat$.pipe(
  mergeMap<number, Promise<Nullable<Decimal>>>(() => fetchData()),
  tap(price => ethPrice$.next(price)),
);

export const [useEthPrice] = bind(ethPrice$, DEFAULT_VALUE);

let subscription: Subscription;

export const subscribeEthPrice = (): void => {
  unsubscribeEthPrice();
  subscription = stream$.subscribe();
};
export const unsubscribeEthPrice = (): void => subscription?.unsubscribe?.();
export const resetEthPrice = (): void => ethPrice$.next(DEFAULT_VALUE);

subscribeEthPrice();
