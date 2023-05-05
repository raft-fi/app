import { state, useStateObservable } from '@react-rxjs/core';
import { createSignal } from '@react-rxjs/utils';

export type AppEventType = 'manage-position';

export interface AppEvent {
  eventType: AppEventType;
  txnHash?: string;
  timestamp: number;
}

const [appEvent$, setAppEvent] = createSignal<AppEvent>();
const stateAppEvent$ = state(appEvent$, null);

export const emitAppEvent = setAppEvent;

export function useAppEvent(): [AppEvent | null, (value: AppEvent) => void] {
  const appEvent = useStateObservable(stateAppEvent$);
  return [appEvent, emitAppEvent];
}

export { appEvent$ };
