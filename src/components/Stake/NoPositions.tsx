import { RaftToken, RAFT_BPT_TOKEN, RAFT_TOKEN, VERAFT_TOKEN } from '@raft-fi/sdk';
import { Decimal, DecimalFormat } from '@tempusfinance/decimal';
import { isValid } from 'date-fns';
import { FC, memo, useCallback, useEffect, useMemo } from 'react';
import { TokenLogo } from 'tempus-ui';
import { COLLATERAL_TOKEN_UI_PRECISION, INPUT_PREVIEW_DIGITS, NUMBER_OF_WEEK_IN_YEAR } from '../../constants';
import {
  useCalculateVeRaftAmount,
  useEstimateStakingApr,
  useRaftTokenAnnualGiveAway,
  useUserRaftBptBalance,
} from '../../hooks';
import { formatCurrency } from '../../utils';
import { Button, CurrencyInput, Typography, ValueLabel } from '../shared';
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
  const { calculateVeRaftAmountStatus, calculateVeRaftAmount } = useCalculateVeRaftAmount();

  const bptAmount = useMemo(() => Decimal.parse(amountToLock, 0), [amountToLock]);
  const veRaftAmount = useMemo(
    () => calculateVeRaftAmountStatus.result ?? Decimal.ZERO,
    [calculateVeRaftAmountStatus.result],
  );
  const weeklyGiveaway = useMemo(
    () => raftTokenAnnualGiveAway?.div(NUMBER_OF_WEEK_IN_YEAR) ?? null,
    [raftTokenAnnualGiveAway],
  );

  const veRaftAmountFormatted = useMemo(
    () =>
      formatCurrency(veRaftAmount, {
        currency: VERAFT_TOKEN,
        fractionDigits: COLLATERAL_TOKEN_UI_PRECISION,
      }),
    [veRaftAmount],
  );
  const userRaftBptBalanceFormatted = useMemo(
    () =>
      formatCurrency(userRaftBptBalance, {
        currency: RAFT_BPT_TOKEN,
        fractionDigits: COLLATERAL_TOKEN_UI_PRECISION,
      }),
    [userRaftBptBalance],
  );
  const weeklyGiveawayFormatted = useMemo(
    () =>
      formatCurrency(weeklyGiveaway, {
        currency: RAFT_TOKEN,
        fractionDigits: COLLATERAL_TOKEN_UI_PRECISION,
      }),
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
  const bptAmountWithEllipse = useMemo(() => {
    const original = bptAmount.toString();
    const truncated = bptAmount.toTruncated(INPUT_PREVIEW_DIGITS);

    return original === truncated ? original : `${truncated}...`;
  }, [bptAmount]);

  const canPreview = useMemo(
    () => bptAmount.gt(0) && deadline && isValid(deadline) && RaftToken.isExtendingStakeBpt(new Date(), deadline),
    [bptAmount, deadline],
  );

  const onBalanceClick = useCallback(() => {
    if (userRaftBptBalance) {
      onAmountChange(userRaftBptBalance.toString());
    }
  }, [onAmountChange, userRaftBptBalance]);

  const goToPreview = useCallback(() => goToPage('preview'), [goToPage]);

  useEffect(() => {
    if (bptAmount && deadline && isValid(deadline)) {
      estimateStakingApr({ bptAmount, unlockTime: deadline });
      calculateVeRaftAmount({ bptAmount, unlockTime: deadline });
    }
  }, [estimateStakingApr, bptAmount, deadline, calculateVeRaftAmount]);

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
          <CurrencyInput
            label="YOU STAKE"
            precision={18}
            selectedToken="RAFT-BPT"
            tokens={['RAFT-BPT']}
            value={amountToLock}
            previewValue={bptAmountWithEllipse}
            maxAmount={bptAmount}
            maxAmountFormatted={userRaftBptBalanceFormatted ?? undefined}
            onValueUpdate={onAmountChange}
            onMaxAmountClick={onBalanceClick}
          />
          <PeriodPicker
            deadline={deadline ?? undefined}
            periodInYear={periodInYear}
            warnSameWeek
            onDeadlineChange={onDeadlineChange}
            onPeriodChange={onPeriodChange}
          />
          <Typography className="raft__stake__label" variant="overline" weight="semi-bold" color="text-secondary">
            TOTAL VOTING POWER
          </Typography>
          <Typography className="raft__stake__value" variant="body" weight="medium" color="text-secondary">
            {veRaftAmountFormatted ? (
              <>
                <TokenLogo type={`token-${VERAFT_TOKEN}`} size={20} />
                <ValueLabel value={veRaftAmountFormatted} valueSize="body" tickerSize="body2" />
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
                <ValueLabel value={weeklyGiveawayFormatted} valueSize="body" tickerSize="body2" />
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
            <Button variant="primary" size="large" onClick={goToPreview} disabled={!canPreview}>
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
