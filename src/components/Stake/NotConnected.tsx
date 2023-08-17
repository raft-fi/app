import { Decimal } from '@tempusfinance/decimal';
import { useConnectWallet } from '@web3-onboard/react';
import { isValid, startOfDay } from 'date-fns';
import { FC, memo, useCallback, useMemo } from 'react';
import { TokenLogo } from 'tempus-ui';
import { COLLATERAL_TOKEN_UI_PRECISION, WEEK_IN_MS, YEAR_IN_MS } from '../../constants';
import { formatDecimal } from '../../utils';
import { Button, Typography, ValueLabel } from '../shared';
import AmountInput from './AmountInput';
import FAQ from './FAQ';
import HowToLock from './HowToLock';
import PeriodPicker from './PeriodPicker';

interface NotConnectedProps {
  amountToLock: string;
  deadline?: Date;
  period?: number;
  onAmountChange: (value: string) => void;
  onDeadlineChange: (value: Date) => void;
  onPeriodChange: (value: number) => void;
}

const NotConnected: FC<NotConnectedProps> = ({
  amountToLock,
  deadline,
  period,
  onAmountChange,
  onDeadlineChange,
  onPeriodChange,
}) => {
  const [, connect] = useConnectWallet();

  const bptAmount = useMemo(() => Decimal.parse(amountToLock, 0), [amountToLock]);
  const veRaftAmount = useMemo(() => {
    if (!deadline || !isValid(deadline)) {
      return Decimal.ZERO;
    }

    const today = startOfDay(new Date());
    // period is floored by week (VotingEscrow.vy#L77)
    const periodInMs = Math.floor((deadline.getTime() - today.getTime()) / WEEK_IN_MS) * WEEK_IN_MS;
    const period = new Decimal(periodInMs).div(YEAR_IN_MS);

    return bptAmount.mul(period);
  }, [bptAmount, deadline]);

  const veRaftAmountFormatted = useMemo(
    () => formatDecimal(veRaftAmount, COLLATERAL_TOKEN_UI_PRECISION),
    [veRaftAmount],
  );

  const onConnectWallet = useCallback(() => {
    connect();
  }, [connect]);

  return (
    <div className="raft__stake raft__stake__not-connected">
      <div className="raft__stake__main">
        <div className="raft__stake__main__container">
          <Typography className="raft__stake__title" variant="heading1" weight="medium">
            Stake RAFT BPT to get veRAFT
          </Typography>
          <Typography className="raft__stake__subtitle" variant="body" color="text-secondary">
            veRAFT aligns the interests of the Raft protocol and RAFT tokenholders. In return for staking your RAFT BPT
            and receiving veRAFT, you will obtain the right to vote on Raft governance proposals and earn more RAFT in
            rewards.
          </Typography>
          <AmountInput value={amountToLock} onChange={onAmountChange} token="B-80RAFT-20ETH" />
          <PeriodPicker
            deadline={deadline}
            period={period}
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
            <Button variant="primary" size="large" onClick={onConnectWallet}>
              <Typography variant="button-label" color="text-primary-inverted">
                Connect wallet
              </Typography>
            </Button>
          </div>
        </div>
      </div>
      <div className="raft__stake__sidebar">
        <FAQ defaultOpen />
        <HowToLock defaultOpen />
      </div>
    </div>
  );
};

export default memo(NotConnected);
