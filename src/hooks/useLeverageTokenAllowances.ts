import { JsonRpcProvider } from 'ethers';
import { bind } from '@react-rxjs/core';
import {
  interval,
  BehaviorSubject,
  Observable,
  startWith,
  combineLatest,
  mergeMap,
  map,
  from,
  merge,
  scan,
  debounce,
  tap,
  Subscription,
  withLatestFrom,
  filter,
  of,
} from 'rxjs';
import { Allowance, RaftConfig } from '@raft-fi/sdk';
import { Decimal } from '@tempusfinance/decimal';
import { DEBOUNCE_IN_MS, POLLING_INTERVAL_IN_MS, SUPPORTED_COLLATERAL_TOKENS } from '../constants';
import { Nullable, SupportedCollateralToken, SupportedToken, TokenDecimalMap } from '../interfaces';
import { walletAddress$ } from './useWalletAddress';
import { provider$ } from './useProvider';
import { AppEvent, appEvent$ } from './useAppEvent';
import { getNullTokenMap } from '../utils';

export type LeverageTokenAllowanceMap = TokenDecimalMap<SupportedCollateralToken>;

const DEFAULT_VALUE: LeverageTokenAllowanceMap = getNullTokenMap<SupportedCollateralToken>(SUPPORTED_COLLATERAL_TOKENS);

const getOneStepLeverageManager = () => {
  return RaftConfig.networkConfig.oneInchOneStepLeverageStEth;
};

const intervalBeat$: Observable<number> = interval(POLLING_INTERVAL_IN_MS).pipe(startWith(0));

export const leverageTokenAllowances$ = new BehaviorSubject<LeverageTokenAllowanceMap>(DEFAULT_VALUE);

const fetchData = async (
  token: SupportedToken,
  walletAddress: string,
  oneStepLeverageManagerAddress: string,
  provider: JsonRpcProvider,
): Promise<Nullable<Decimal>> => {
  if (RaftConfig.networkId !== 1) {
    console.warn('Leverage is only available on mainnet.');
    return Decimal.ZERO;
  }

  try {
    const allowance = new Allowance(token, walletAddress, oneStepLeverageManagerAddress, provider);

    const result = await allowance.fetchAllowance();

    return result;
  } catch (error) {
    console.error(`useTokenAllowances - Failed to get token allowance for ${token}`, error);
    return null;
  }
};

// Fetch new allowance data every time wallet address changes
const walletChangeStream$: Observable<LeverageTokenAllowanceMap> = walletAddress$.pipe(
  withLatestFrom(provider$),
  mergeMap<[Nullable<string>, JsonRpcProvider], Observable<LeverageTokenAllowanceMap>>(([walletAddress, provider]) => {
    if (!walletAddress) {
      return of(DEFAULT_VALUE);
    }

    const tokenAllowanceMaps = SUPPORTED_COLLATERAL_TOKENS.map(token =>
      from(fetchData(token, walletAddress, getOneStepLeverageManager(), provider)).pipe(
        map(allowance => ({ [token]: allowance } as LeverageTokenAllowanceMap)),
      ),
    );

    return merge(...tokenAllowanceMaps);
  }),
);

type PeriodicStreamInput = [[number], Nullable<string>, JsonRpcProvider];

// stream$ for periodic polling to fetch data
const periodicStream$: Observable<LeverageTokenAllowanceMap> = combineLatest([intervalBeat$]).pipe(
  withLatestFrom(walletAddress$, provider$),
  mergeMap<PeriodicStreamInput, Observable<LeverageTokenAllowanceMap>>(([, walletAddress, provider]) => {
    if (!walletAddress) {
      return of(DEFAULT_VALUE);
    }

    const tokenAllowanceMaps = SUPPORTED_COLLATERAL_TOKENS.map(token =>
      from(fetchData(token, walletAddress, getOneStepLeverageManager(), provider)).pipe(
        map(allowance => ({ [token]: allowance } as LeverageTokenAllowanceMap)),
      ),
    );

    return merge(...tokenAllowanceMaps);
  }),
);

// fetch when app event fire
const appEventsStream$ = appEvent$.pipe(
  withLatestFrom(walletAddress$, provider$),
  filter((value): value is [AppEvent, string, JsonRpcProvider] => {
    const [, walletAddress] = value;

    return Boolean(walletAddress);
  }),
  mergeMap(([, walletAddress, provider]) => {
    const tokenAllowanceMaps = SUPPORTED_COLLATERAL_TOKENS.map(token =>
      from(fetchData(token, walletAddress, getOneStepLeverageManager(), provider)).pipe(
        map(allowance => ({ [token]: allowance } as LeverageTokenAllowanceMap)),
      ),
    );

    return merge(...tokenAllowanceMaps);
  }),
);

// merge all stream$ into one, use merge() for multiple
const stream$ = merge(periodicStream$, walletChangeStream$, appEventsStream$).pipe(
  scan(
    (allAllowances, tokenAllowances) => ({
      ...allAllowances,
      ...tokenAllowances,
    }),
    {} as LeverageTokenAllowanceMap,
  ),
  debounce<LeverageTokenAllowanceMap>(() => interval(DEBOUNCE_IN_MS)),
  tap(allAllowances => leverageTokenAllowances$.next(allAllowances)),
);

export const [useLeverageTokenAllowances] = bind(leverageTokenAllowances$, DEFAULT_VALUE);

let subscription: Subscription;

export const subscribeLeverageTokenAllowances = (): void => {
  unsubscribeLeverageTokenAllowances();
  subscription = stream$.subscribe();
};
export const unsubscribeLeverageTokenAllowances = (): void => subscription?.unsubscribe();
export const resetLeverageTokenAllowances = (): void => leverageTokenAllowances$.next(DEFAULT_VALUE);
