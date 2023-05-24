import { state, useStateObservable } from '@react-rxjs/core';
import { createSignal } from '@react-rxjs/utils';
import { Nullable } from '../interfaces';

export type AppEventType = 'manage-position' | 'approve-token' | 'whitelist-delegate-token';

export interface AppEvent {
  eventType: AppEventType;
  txnHash?: string;
  timestamp: number;
}

const [appEvent$, setAppEvent] = createSignal<AppEvent>();
const stateAppEvent$ = state(appEvent$, null);

export const emitAppEvent = setAppEvent;

export function useAppEvent(): [Nullable<AppEvent>, (value: AppEvent) => void] {
  const appEvent = useStateObservable(stateAppEvent$);
  return [appEvent, emitAppEvent];
}

export { appEvent$ };
