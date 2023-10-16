import { v4 as uuid } from 'uuid';
import { Decimal, DecimalFormat } from '@tempusfinance/decimal';
import { RAFT_BPT_TOKEN, VERAFT_TOKEN } from '@raft-fi/sdk';
import { format } from 'date-fns';
import { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { TokenLogo } from 'tempus-ui';
import { COLLATERAL_TOKEN_UI_PRECISION } from '../../constants';
import { useEstimateStakingApr, useUserVeRaftBalance, useWithdrawRaftBpt } from '../../hooks';
import { formatCurrency } from '../../utils';
import { Button, Loading, Typography, ValueLabel } from '../shared';
import Claim from './Claim';
import FAQ from './FAQ';
import HowToLock from './HowToLock';
import { StakePage } from './Stake';

interface HasPositionProps {
  goToPage: (page: StakePage) => void;
}

const HasPosition: FC<HasPositionProps> = ({ goToPage }) => {
  const userVeRaftBalance = useUserVeRaftBalance();
  const { estimateStakingAprStatus, estimateStakingApr } = useEstimateStakingApr();
  const { withdrawRaftBptStatus, withdrawRaftBpt } = useWithdrawRaftBpt();

  const [actionButtonState, setActionButtonState] = useState<string>('default');

  const bptLockedBalance = useMemo(
    () => userVeRaftBalance?.bptLockedBalance ?? null,
    [userVeRaftBalance?.bptLockedBalance],
  );
  const veRaftBalance = useMemo(() => userVeRaftBalance?.veRaftBalance ?? null, [userVeRaftBalance?.veRaftBalance]);
  const unlockTime = useMemo(() => userVeRaftBalance?.unlockTime ?? null, [userVeRaftBalance?.unlockTime]);

  const bptLockedBalanceFormatted = useMemo(
    () =>
      formatCurrency(bptLockedBalance, {
        currency: RAFT_BPT_TOKEN,
        fractionDigits: COLLATERAL_TOKEN_UI_PRECISION,
      }),
    [bptLockedBalance],
  );
  const veRaftBalanceFormatted = useMemo(
    () =>
      formatCurrency(veRaftBalance, {
        currency: VERAFT_TOKEN,
        fractionDigits: COLLATERAL_TOKEN_UI_PRECISION,
      }),
    [veRaftBalance],
  );
  const unlockTimeFormatted = useMemo(() => (unlockTime ? format(unlockTime, 'dd MMMM yyyy') : null), [unlockTime]);
  const stakingAprFormatted = useMemo(() => {
    const apr = estimateStakingAprStatus.result;

    if (!apr) {
      return null;
    }

    return DecimalFormat.format(apr, {
      style: 'percentage',
      fractionDigits: 2,
    });
  }, [estimateStakingAprStatus.result]);

  const canWithdraw = useMemo(
    () =>
      Boolean(
        bptLockedBalance?.gt(0) && userVeRaftBalance?.unlockTime && userVeRaftBalance.unlockTime.getTime() < Date.now(),
      ),
    [bptLockedBalance, userVeRaftBalance?.unlockTime],
  );

  const goToAdjust = useCallback(() => goToPage('adjust'), [goToPage]);
  const onWithdraw = useCallback(() => {
    if (canWithdraw && bptLockedBalance) {
      const txnId = uuid();
      withdrawRaftBpt({ withdrawAmount: bptLockedBalance, txnId });
    }
  }, [bptLockedBalance, canWithdraw, withdrawRaftBpt]);

  /**
   * Update action button state based on current redeem request status
   */
  useEffect(() => {
    if (!withdrawRaftBptStatus) {
      return;
    }

    if (withdrawRaftBptStatus.pending) {
      setActionButtonState('loading');
    } else if (withdrawRaftBptStatus.success) {
      setActionButtonState('success');
    } else {
      setActionButtonState('default');
    }
  }, [withdrawRaftBptStatus]);

  useEffect(() => {
    if (unlockTime) {
      // passing zero new BPT amount to calculate current APR
      estimateStakingApr({ bptAmount: Decimal.ZERO, unlockTime });
    }
  }, [estimateStakingApr, unlockTime]);

  return (
    <div className="raft__stake raft__stake__has-position">
      <div className="raft__stake__main">
        <div className="raft__stake__main__container">
          <Typography className="raft__stake__title" variant="heading1" weight="medium">
            Your stake
          </Typography>
          <Typography className="raft__stake__subtitle" variant="body" color="text-secondary">
            Below is a summary of your current voting power for Raft governance.
          </Typography>
          <Typography className="raft__stake__label" variant="overline" weight="semi-bold" color="text-secondary">
            STAKED
          </Typography>
          <Typography className="raft__stake__value" variant="body" weight="medium" color="text-secondary">
            {bptLockedBalanceFormatted ? (
              <>
                <TokenLogo type="token-RAFT-BPT" size={20} />
                <ValueLabel value={bptLockedBalanceFormatted} valueSize="body" tickerSize="body2" />
              </>
            ) : (
              'N/A'
            )}
          </Typography>
          <Typography className="raft__stake__label" variant="overline" weight="semi-bold" color="text-secondary">
            TOTAL VOTING POWER
          </Typography>
          <Typography className="raft__stake__value" variant="body" weight="medium" color="text-secondary">
            {veRaftBalanceFormatted ? (
              <>
                <TokenLogo type={`token-${VERAFT_TOKEN}`} size={20} />
                <ValueLabel value={veRaftBalanceFormatted} valueSize="body" tickerSize="body2" />
              </>
            ) : (
              'N/A'
            )}
          </Typography>
          <Typography className="raft__stake__label" variant="overline" weight="semi-bold" color="text-secondary">
            ESTIMATED APR
          </Typography>
          <Typography className="raft__stake__value" variant="body" weight="medium" color="text-secondary">
            {stakingAprFormatted ? (
              <ValueLabel value={stakingAprFormatted} valueSize="body" tickerSize="body2" />
            ) : (
              'N/A'
            )}
          </Typography>
          <Typography className="raft__stake__label" variant="overline" weight="semi-bold" color="text-secondary">
            STAKED UNTIL
          </Typography>
          <Typography className="raft__stake__value" variant="body" weight="medium">
            {unlockTimeFormatted ?? '---'}
          </Typography>
          <div className="raft__stake__btn-container">
            <Button variant="secondary" size="large" onClick={goToAdjust}>
              <Typography variant="button-label" color="text-secondary">
                Adjust stake
              </Typography>
            </Button>
            {canWithdraw && (
              <Button variant="primary" size="large" onClick={onWithdraw} disabled={actionButtonState === 'loading'}>
                {actionButtonState === 'loading' && <Loading />}
                <Typography variant="button-label" color="text-primary-inverted">
                  Withdraw
                </Typography>
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="raft__stake__sidebar">
        <Claim />
        <FAQ defaultOpen={false} />
        <HowToLock defaultOpen={false} />
      </div>
    </div>
  );
};

export default memo(HasPosition);
