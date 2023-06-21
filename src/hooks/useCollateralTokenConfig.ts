import { RaftConfig } from '@raft-fi/sdk';
import { CollateralTokenConfig } from '@raft-fi/sdk/dist/config/types';
import { bind } from '@react-rxjs/core';
import { createSignal } from '@react-rxjs/utils';
import { BehaviorSubject, combineLatest, map, Subscription, tap } from 'rxjs';
import { TOKEN_TO_UNDERLYING_TOKEN_MAP } from '../constants';
import { Nullable, SupportedCollateralToken } from '../interfaces';

const DEFAULT_VALUE = null;

const [collateralToken$, setCollateralToken] = createSignal<SupportedCollateralToken>();
const collateralTokenConfig$ = new BehaviorSubject<Nullable<CollateralTokenConfig>>(DEFAULT_VALUE);

const stream$ = combineLatest([collateralToken$]).pipe(
  map(
    ([collateralToken]) =>
      RaftConfig.networkConfig.underlyingTokens[TOKEN_TO_UNDERLYING_TOKEN_MAP[collateralToken]]
        .supportedCollateralTokens[collateralToken],
  ),
  tap(config => {
    collateralTokenConfig$.next(config);
  }),
);

const [collateralTokenConfig] = bind<Nullable<CollateralTokenConfig>>(collateralTokenConfig$, DEFAULT_VALUE);

export const useCollateralTokenConfig = (): {
  collateralTokenConfig: Nullable<CollateralTokenConfig>;
  setCollateralTokenForConfig: (payload: SupportedCollateralToken) => void;
} => ({
  collateralTokenConfig: collateralTokenConfig(),
  setCollateralTokenForConfig: setCollateralToken,
});

let subscriptions: Subscription[];

export const subscribeCollateralTokenConfig = (): void => {
  unsubscribeCollateralTokenConfig();
  subscriptions = [stream$.subscribe()];
};
export const unsubscribeCollateralTokenConfig = (): void =>
  subscriptions?.forEach(subscription => subscription.unsubscribe());
export const resetCollateralTokenConfig = (): void => {
  collateralTokenConfig$.next(DEFAULT_VALUE);
};
