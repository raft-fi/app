import { state, useStateObservable } from '@react-rxjs/core';
import { createSignal } from '@react-rxjs/utils';
import { Decimal } from '@tempusfinance/decimal';
import { Nullable, SupportedCollateralToken, SupportedUnderlyingCollateralToken } from '../interfaces';

export type AppEventType =
  | 'whitelist'
  | 'approve'
  | 'permit'
  | 'manage'
  | 'leverage'
  | 'redeem'
  | 'manageSavings'
  | 'bridge';

export interface AppEventMetadata {
  collateralToken?: SupportedCollateralToken;
  underlyingCollateralToken?: SupportedUnderlyingCollateralToken;
  tokenAmount?: Decimal;
  currentPrincipalCollateral?: Decimal;
}
export interface AppEvent {
  eventType: AppEventType;
  metadata?: AppEventMetadata;
  txnHash?: string;
  timestamp: number;
}

const [appEvent$, setAppEvent] = createSignal<Nullable<AppEvent>>();
const stateAppEvent$ = state(appEvent$, null);

export const emitAppEvent = setAppEvent;

export function useAppEvent(): [Nullable<AppEvent>, (value: Nullable<AppEvent>) => void] {
  const appEvent = useStateObservable(stateAppEvent$);
  return [appEvent, emitAppEvent];
}

export { appEvent$ };
