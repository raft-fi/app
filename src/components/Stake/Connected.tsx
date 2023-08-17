import { Decimal } from '@tempusfinance/decimal';
import { isValid, startOfDay } from 'date-fns';
import { FC, memo, useCallback, useMemo } from 'react';
import { TokenLogo } from 'tempus-ui';
import { COLLATERAL_TOKEN_UI_PRECISION, WEEK_IN_MS, YEAR_IN_MS } from '../../constants';
import { useUserRaftBptBalance, useUserVeRaftBalance } from '../../hooks';
import { formatDecimal } from '../../utils';
import { Button, Typography, ValueLabel } from '../shared';
import AmountInput from './AmountInput';
import CurrentPosition from './CurrentPosition';
import FAQ from './FAQ';
import HowToLock from './HowToLock';
import PeriodPicker from './PeriodPicker';
import { StakePage } from './Stake';

interface ConnectedProps {
  amountToLock: string;
  deadline?: Date;
  period?: number;
  onAmountChange: (value: string) => void;
  onDeadlineChange: (value: Date) => void;
  onPeriodChange: (value: number) => void;
  goToPage: (page: StakePage) => void;
}

const Connected: FC<ConnectedProps> = ({
  amountToLock,
  deadline,
  period,
  onAmountChange,
  onDeadlineChange,
  onPeriodChange,
  goToPage,
}) => {
  const userVeRaftBalance = useUserVeRaftBalance();
  const userRaftBptBalance = useUserRaftBptBalance();

  const bptAmount = useMemo(() => Decimal.parse(amountToLock, 0), [amountToLock]);
  const unlockTime = useMemo(
    () => deadline ?? userVeRaftBalance?.unlockTime,
    [deadline, userVeRaftBalance?.unlockTime],
  );
  const veRaftAmount = useMemo(() => {
    if (!unlockTime || !isValid(unlockTime)) {
      return Decimal.ZERO;
    }

    const today = startOfDay(new Date());
    // period is floored by week (VotingEscrow.vy#L77)
    const periodInMs = Math.floor((unlockTime.getTime() - today.getTime()) / WEEK_IN_MS) * WEEK_IN_MS;
    const period = new Decimal(periodInMs).div(YEAR_IN_MS);

    return bptAmount.mul(period);
  }, [bptAmount, unlockTime]);
  const hasPosition = useMemo(
    () => Boolean(userVeRaftBalance?.bptLockedBalance.gt(0)),
    [userVeRaftBalance?.bptLockedBalance],
  );

  const veRaftAmountFormatted = useMemo(
    () => formatDecimal(veRaftAmount, COLLATERAL_TOKEN_UI_PRECISION),
    [veRaftAmount],
  );
  const userRaftBptBalanceFormatted = useMemo(
    () => formatDecimal(userRaftBptBalance, COLLATERAL_TOKEN_UI_PRECISION),
    [userRaftBptBalance],
  );

  const onBalanceClick = useCallback(() => {
    if (userRaftBptBalance) {
      onAmountChange(userRaftBptBalance.toString());
    }
  }, [onAmountChange, userRaftBptBalance]);

  const goToPreview = useCallback(() => goToPage('preview'), [goToPage]);
  const goToWithdraw = useCallback(() => goToPage('withdraw'), [goToPage]);
  const goToClaim = useCallback(() => goToPage('claim'), [goToPage]);

  const positionButtons = useMemo(
    () => [
      <Button variant="secondary" size="large" onClick={goToWithdraw} disabled={!hasPosition}>
        <Typography variant="button-label" weight="medium" color="text-secondary">
          Withdraw
        </Typography>
      </Button>,
      <Button variant="secondary" size="large" onClick={goToClaim} disabled={!hasPosition}>
        <Typography variant="button-label" weight="medium" color="text-secondary">
          Claim
        </Typography>
      </Button>,
    ],
    [goToClaim, goToWithdraw, hasPosition],
  );

  return (
    <div className="raft__stake raft__stake__connected">
      <div className="raft__stake__main">
        <div className="raft__stake__main__container">
          <Typography className="raft__stake__title" variant="heading1" weight="medium">
            Stake RAFT BPT to get veRAFT
          </Typography>
          <Typography className="raft__stake__subtitle" variant="body" color="text-secondary">
            veRAFT is at the centre of governance and growth of the Raft protocol. By staking your Raft Balancer LP
            tokens, veRAFT tokenholders will be able to vote on Raft governance proposals while earning more RAFT.
          </Typography>
          <AmountInput
            value={amountToLock}
            balance={userRaftBptBalanceFormatted ?? undefined}
            token="B-80RAFT-20ETH"
            onChange={onAmountChange}
            onBalanceClick={onBalanceClick}
          />
          <PeriodPicker
            deadline={unlockTime ?? undefined}
            period={period}
            min={unlockTime ?? undefined}
            onDeadlineChange={onDeadlineChange}
            onPeriodChange={onPeriodChange}
          />
          <Typography className="raft__stake__label" variant="overline" weight="semi-bold" color="text-secondary">
            RESULTING veRAFT
          </Typography>
          <Typography className="raft__stake__value" variant="body" weight="medium" color="text-secondary">
            {veRaftAmountFormatted ? (
              <>
                <TokenLogo type="token-veRAFT" size={20} />
                <ValueLabel value={`${veRaftAmountFormatted} veRAFT`} valueSize="body" tickerSize="body2" />
              </>
            ) : (
              'N/A'
            )}
          </Typography>
          <Typography className="raft__stake__label" variant="overline" weight="semi-bold" color="text-secondary">
            WEEKLY RAFT REWARDS
          </Typography>
          <Typography className="raft__stake__value" variant="body" weight="medium" color="text-secondary">
            {/* https://docs.balancer.fi/reference/vebal-and-gauges/estimating-gauge-incentive-aprs.html
              The overall gauge vote percentage directs the weekly BAL emissions.
              If the weekly total amount is 145,000 BAL per week, a pool gauge with 1% of the vote will net in 1,450 BAL towards that gauge
          */}
            N/A
          </Typography>
          <Typography className="raft__stake__label" variant="overline" weight="semi-bold" color="text-secondary">
            ESTIMATED APR
          </Typography>
          <Typography className="raft__stake__value" variant="body" weight="medium" color="text-secondary">
            {'N/A'}
          </Typography>
          <div className="raft__stake__btn-container">
            <Button variant="primary" size="large" onClick={goToPreview}>
              <Typography variant="button-label" color="text-primary-inverted">
                Preview
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

export default memo(Connected);
