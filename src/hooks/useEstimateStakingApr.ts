import { bind } from '@react-rxjs/core';
import { createSignal } from '@react-rxjs/utils';
import { Decimal } from '@tempusfinance/decimal';
import { BehaviorSubject, concatMap, tap, combineLatest } from 'rxjs';
import { Nullable } from '../interfaces';
import { raftToken$ } from './useRaftToken';
import { userVeRaftBalance$ } from './useUserVeRaftBalance';

const DEFAULT_VALUE = {
  pending: false,
  request: null,
  result: null,
};

interface EstimateStakingAprRequest {
  bptAmount: Decimal;
  unlockTime: Date;
}

interface EstimateStakingAprStatus {
  pending: boolean;
  request: Nullable<EstimateStakingAprRequest>;
  result: Nullable<Decimal>;
  error?: Error;
}

interface EstimateStakingAprResponse {
  request: EstimateStakingAprRequest;
  result: Nullable<Decimal>;
}

const [estimateStakingAprRequest$, setEstimateStakingAprRequest] = createSignal<EstimateStakingAprRequest>();
const estimateStakingApr$ = new BehaviorSubject<EstimateStakingAprStatus>(DEFAULT_VALUE);

const stream$ = combineLatest([estimateStakingAprRequest$, raftToken$, userVeRaftBalance$]).pipe(
  concatMap(async ([request, raftToken, userVeRaftBalance]) => {
    const { bptAmount, unlockTime } = request;
    const { bptLockedBalance, veRaftBalance } = userVeRaftBalance ?? {};

    if (!raftToken) {
      return {
        request,
        result: null,
      };
    }

    try {
      estimateStakingApr$.next({ pending: true, request, result: null });

      const apr = await raftToken.estimateStakingApr(bptAmount, unlockTime, { bptLockedBalance, veRaftBalance });

      return {
        request,
        result: apr,
      };
    } catch (error) {
      console.error('useEstimateStakingApr (catch) - failed to estimate staking APR!', error);
      return {
        request,
        result: null,
        error,
      } as EstimateStakingAprResponse;
    }
  }),
  tap<EstimateStakingAprResponse>(response => {
    estimateStakingApr$.next({ ...response, pending: false });
  }),
);

const [estimateStakingAprStatus] = bind<EstimateStakingAprStatus>(estimateStakingApr$, DEFAULT_VALUE);

export const useEstimateStakingApr = (): {
  estimateStakingAprStatus: EstimateStakingAprStatus;
  estimateStakingApr: (payload: EstimateStakingAprRequest) => void;
} => ({
  estimateStakingAprStatus: estimateStakingAprStatus(),
  estimateStakingApr: setEstimateStakingAprRequest,
});

stream$.subscribe();
