import { bind } from '@react-rxjs/core';
import { createSignal } from '@react-rxjs/utils';
import { Decimal } from '@tempusfinance/decimal';
import { BehaviorSubject, concatMap, tap, combineLatest } from 'rxjs';
import { Nullable } from '../interfaces';
import { raftToken$ } from './useRaftToken';

const DEFAULT_VALUE = {
  pending: false,
  request: null,
  result: null,
};

interface CalculateVeRaftAmountRequest {
  bptAmount: Decimal;
  unlockTime: Date;
}

interface CalculateVeRaftAmountStatus {
  pending: boolean;
  request: Nullable<CalculateVeRaftAmountRequest>;
  result: Nullable<Decimal>;
  error?: Error;
}

interface CalculateVeRaftAmountResponse {
  request: CalculateVeRaftAmountRequest;
  result: Nullable<Decimal>;
}

const [calculateVeRaftAmountRequest$, setCalculateVeRaftAmountRequest] = createSignal<CalculateVeRaftAmountRequest>();
const calculateVeRaftAmount$ = new BehaviorSubject<CalculateVeRaftAmountStatus>(DEFAULT_VALUE);

const stream$ = combineLatest([calculateVeRaftAmountRequest$, raftToken$]).pipe(
  concatMap(async ([request, raftToken]) => {
    const { bptAmount, unlockTime } = request;

    if (!raftToken) {
      return {
        request,
        result: null,
      };
    }

    try {
      calculateVeRaftAmount$.next({ pending: true, request, result: null });

      const result = await raftToken.calculateVeRaftAmount(bptAmount, unlockTime);

      return {
        request,
        result,
      };
    } catch (error) {
      console.error('useCalculateVeRaftAmount (catch) - failed to calculate veRAFT amount!', error);
      return {
        request,
        result: null,
        error,
      } as CalculateVeRaftAmountResponse;
    }
  }),
  tap<CalculateVeRaftAmountResponse>(response => {
    calculateVeRaftAmount$.next({ ...response, pending: false });
  }),
);

const [calculateVeRaftAmountStatus] = bind<CalculateVeRaftAmountStatus>(calculateVeRaftAmount$, DEFAULT_VALUE);

export const useCalculateVeRaftAmount = (): {
  calculateVeRaftAmountStatus: CalculateVeRaftAmountStatus;
  calculateVeRaftAmount: (payload: CalculateVeRaftAmountRequest) => void;
} => ({
  calculateVeRaftAmountStatus: calculateVeRaftAmountStatus(),
  calculateVeRaftAmount: setCalculateVeRaftAmountRequest,
});

stream$.subscribe();
