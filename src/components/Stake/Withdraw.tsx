import { v4 as uuid } from 'uuid';
import { RAFT_BPT_TOKEN } from '@raft-fi/sdk';
import { Decimal } from '@tempusfinance/decimal';
import { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { TokenLogo } from 'tempus-ui';
import { COLLATERAL_TOKEN_UI_PRECISION } from '../../constants';
import { useUserVeRaftBalance, useWithdrawRaftBpt } from '../../hooks';
import { formatDecimal } from '../../utils';
import { Button, Loading, Typography, ValueLabel } from '../shared';
import CurrentPosition from './CurrentPosition';
import FAQ from './FAQ';
import HowToLock from './HowToLock';
import { StakePage } from './Stake';

interface WithdrawProps {
  goToPage: (page: StakePage) => void;
}

const Withdraw: FC<WithdrawProps> = ({ goToPage }) => {
  const userVeRaftBalance = useUserVeRaftBalance();
  const { withdrawRaftBptStatus, withdrawRaftBpt } = useWithdrawRaftBpt();

  const [actionButtonState, setActionButtonState] = useState<string>('default');

  const bptLockedAmount = useMemo(
    () => userVeRaftBalance?.bptLockedBalance ?? null,
    [userVeRaftBalance?.bptLockedBalance],
  );
  const canWithdraw = useMemo(
    () =>
      Boolean(
        bptLockedAmount?.gt(0) && userVeRaftBalance?.unlockTime && userVeRaftBalance.unlockTime.getTime() < Date.now(),
      ),
    [bptLockedAmount, userVeRaftBalance?.unlockTime],
  );
  const bptLockedAmountFormatted = useMemo(
    () => formatDecimal(canWithdraw ? bptLockedAmount : Decimal.ZERO, COLLATERAL_TOKEN_UI_PRECISION),
    [bptLockedAmount, canWithdraw],
  );

  const goToDefault = useCallback(() => goToPage('default'), [goToPage]);
  const goToClaim = useCallback(() => goToPage('claim'), [goToPage]);
  const onWithdraw = useCallback(() => {
    if (canWithdraw) {
      const txnId = uuid();
      withdrawRaftBpt({ txnId });
    }
  }, [canWithdraw, withdrawRaftBpt]);

  const positionButtons = useMemo(
    () => [
      <Button key="btn-stake" variant="secondary" size="large" onClick={goToDefault}>
        <Typography variant="button-label" weight="medium" color="text-secondary">
          Stake more
        </Typography>
      </Button>,
      <Button key="btn-claim" variant="secondary" size="large" onClick={goToClaim}>
        <Typography variant="button-label" weight="medium" color="text-secondary">
          Claim
        </Typography>
      </Button>,
    ],
    [goToClaim, goToDefault],
  );

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
      goToDefault();
    } else {
      setActionButtonState('default');
    }
  }, [goToDefault, withdrawRaftBptStatus]);

  return (
    <div className="raft__stake raft__stake__preview">
      <div className="raft__stake__main">
        <div className="raft__stake__main__container">
          <Typography className="raft__stake__title" variant="heading1" weight="medium">
            Claim and withdraw
          </Typography>
          <Typography className="raft__stake__subtitle" variant="body" color="text-secondary">
            Withdraw your stake
          </Typography>
          <Typography className="raft__stake__label" variant="overline" weight="semi-bold" color="text-secondary">
            AVAILABLE TO WITHDRAW
          </Typography>
          <Typography className="raft__stake__value" variant="body" weight="medium" color="text-secondary">
            {bptLockedAmountFormatted ? (
              <>
                <TokenLogo type={`token-${RAFT_BPT_TOKEN}`} size={20} />
                <ValueLabel
                  value={`${bptLockedAmountFormatted} ${RAFT_BPT_TOKEN}`}
                  valueSize="body"
                  tickerSize="body2"
                />
              </>
            ) : (
              'N/A'
            )}
          </Typography>
          <div className="raft__stake__btn-container">
            <Button
              variant="primary"
              size="large"
              onClick={onWithdraw}
              disabled={!canWithdraw || actionButtonState === 'loading'}
            >
              {actionButtonState === 'loading' && <Loading />}
              <Typography variant="button-label" color="text-primary-inverted">
                Withdraw
              </Typography>
            </Button>
          </div>
        </div>
      </div>
      <div className="raft__stake__sidebar">
        <CurrentPosition buttons={positionButtons} />
        <FAQ defaultOpen={false} />
        <HowToLock defaultOpen={false} />
      </div>
    </div>
  );
};

export default memo(Withdraw);
