import { useCallback } from 'react';
import { distinctUntilChanged } from 'rxjs';
import { state, useStateObservable } from '@react-rxjs/core';
import { createSignal } from '@react-rxjs/utils';
import { Decimal } from '@tempusfinance/decimal';
import { DEFAULT_SLIPPAGE } from '../constants';
import { SwapRouter } from '@raft-fi/sdk';

export interface SettingOptions {
  router: SwapRouter;
  slippage: Decimal;
}

const [rawRouter$, setRouter] = createSignal<SwapRouter>();
const [rawSlippage$, setSlippage] = createSignal<Decimal>();

const router$ = rawRouter$.pipe(distinctUntilChanged());
const slippage$ = rawSlippage$.pipe(distinctUntilChanged());

const stateRouter$ = state(router$, '1inch');
const stateSlippage$ = state(slippage$, new Decimal(DEFAULT_SLIPPAGE));

export function useSettingOptions(): [SettingOptions, (partial: Partial<SettingOptions>) => void] {
  const router = useStateObservable(stateRouter$);
  const slippage = useStateObservable(stateSlippage$);

  const setPartialOption = useCallback((partial: Partial<SettingOptions>) => {
    Object.keys(partial).forEach(field => {
      switch (field) {
        case 'router':
          if (partial.router !== undefined) {
            setRouter(partial.router);
          }
          break;
        case 'slippage':
          if (partial.slippage !== undefined) {
            setSlippage(partial.slippage);
          }
          break;
        default:
          break;
      }
    });
  }, []);

  return [{ router, slippage }, setPartialOption];
}
