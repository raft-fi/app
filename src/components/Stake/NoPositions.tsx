import { RAFT_BPT_TOKEN, RAFT_TOKEN, VERAFT_TOKEN } from '@raft-fi/sdk';
import { Decimal, DecimalFormat } from '@tempusfinance/decimal';
import { isValid, startOfDay } from 'date-fns';
import { FC, memo, useCallback, useEffect, useMemo } from 'react';
import { TokenLogo } from 'tempus-ui';
import { COLLATERAL_TOKEN_UI_PRECISION, NUMBER_OF_WEEK_IN_YEAR, WEEK_IN_MS, YEAR_IN_MS } from '../../constants';
import { useEstimateStakingApr, useRaftTokenAnnualGiveAway, useUserRaftBptBalance } from '../../hooks';
import { formatDecimal } from '../../utils';
import { Button, Typography, ValueLabel } from '../shared';
import AmountInput from './AmountInput';
import FAQ from './FAQ';
import HowToLock from './HowToLock';
import PeriodPicker from './PeriodPicker';
import { StakePage } from './Stake';

interface NoPositionsProps {
  amountToLock: string;
  deadline?: Date;
  periodInYear?: number;
  onAmountChange: (value: string) => void;
  onDeadlineChange: (value: Date) => void;
  onPeriodChange: (value: number) => void;
  goToPage: (page: StakePage) => void;
}

const NoPositions: FC<NoPositionsProps> = ({
  amountToLock,
  deadline,
  periodInYear,
  onAmountChange,
  onDeadlineChange,
  onPeriodChange,
  goToPage,
}) => {
  const userRaftBptBalance = useUserRaftBptBalance();
  const raftTokenAnnualGiveAway = useRaftTokenAnnualGiveAway();
  const { estimateStakingAprStatus, estimateStakingApr } = useEstimateStakingApr();

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
  const weeklyGiveaway = useMemo(
    () => raftTokenAnnualGiveAway?.div(NUMBER_OF_WEEK_IN_YEAR) ?? null,
    [raftTokenAnnualGiveAway],
  );

  const veRaftAmountFormatted = useMemo(
    () => formatDecimal(veRaftAmount, COLLATERAL_TOKEN_UI_PRECISION),
    [veRaftAmount],
  );
  const userRaftBptBalanceFormatted = useMemo(
    () => formatDecimal(userRaftBptBalance, COLLATERAL_TOKEN_UI_PRECISION),
    [userRaftBptBalance],
  );
  const weeklyGiveawayFormatted = useMemo(
    () => formatDecimal(weeklyGiveaway, COLLATERAL_TOKEN_UI_PRECISION),
    [weeklyGiveaway],
  );
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

  const onBalanceClick = useCallback(() => {
    if (userRaftBptBalance) {
      onAmountChange(userRaftBptBalance.toString());
    }
  }, [onAmountChange, userRaftBptBalance]);

  const goToPreview = useCallback(() => goToPage('preview'), [goToPage]);

  useEffect(() => {
    if (bptAmount && deadline) {
      estimateStakingApr({ bptAmount, unlockTime: deadline });
    }
  }, [estimateStakingApr, bptAmount, deadline]);

  return (
    <div className="raft__stake raft__stake__no-positions">
      <div className="raft__stake__main">
        <div className="raft__stake__main__container">
          <Typography className="raft__stake__title" variant="heading1" weight="medium">
            Stake RAFT BPT to get veRAFT
          </Typography>
          <Typography className="raft__stake__subtitle" variant="body" color="text-secondary">
            veRAFT aligns the interests of the Raft protocol and RAFT tokenholders. In return for staking your RAFT BPT
            and receiving veRAFT, you will gain the right to vote on Raft governance proposals and earn more RAFT in
            rewards.
          </Typography>
          <AmountInput
            value={amountToLock}
            balance={userRaftBptBalanceFormatted ?? undefined}
            token={RAFT_BPT_TOKEN}
            onChange={onAmountChange}
            onBalanceClick={onBalanceClick}
          />
          <PeriodPicker
            deadline={deadline ?? undefined}
            periodInYear={periodInYear}
            min={deadline ?? undefined}
            onDeadlineChange={onDeadlineChange}
            onPeriodChange={onPeriodChange}
          />
          <Typography className="raft__stake__label" variant="overline" weight="semi-bold" color="text-secondary">
            TOTAL VOTING ESCROW
          </Typography>
          <Typography className="raft__stake__value" variant="body" weight="medium" color="text-secondary">
            {veRaftAmountFormatted ? (
              <>
                <TokenLogo type={`token-${VERAFT_TOKEN}`} size={20} />
                <ValueLabel value={`${veRaftAmountFormatted} ${VERAFT_TOKEN}`} valueSize="body" tickerSize="body2" />
              </>
            ) : (
              'N/A'
            )}
          </Typography>
          <Typography className="raft__stake__label" variant="overline" weight="semi-bold" color="text-secondary">
            WEEKLY RAFT REWARDS
          </Typography>
          <Typography className="raft__stake__value" variant="body" weight="medium" color="text-secondary">
            {weeklyGiveawayFormatted ? (
              <>
                <TokenLogo type={`token-${RAFT_TOKEN}`} size={20} />
                <ValueLabel value={`${weeklyGiveawayFormatted} ${RAFT_TOKEN}`} valueSize="body" tickerSize="body2" />
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
        <FAQ defaultOpen={false} />
        <HowToLock defaultOpen={false} />
      </div>
    </div>
  );
};

export default memo(NoPositions);
