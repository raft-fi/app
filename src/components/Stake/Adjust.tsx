import { RAFT_BPT_TOKEN, VERAFT_TOKEN } from '@raft-fi/sdk';
import { Decimal, DecimalFormat } from '@tempusfinance/decimal';
import { isValid } from 'date-fns';
import { FC, memo, useCallback, useEffect, useMemo } from 'react';
import { TokenLogo } from 'tempus-ui';
import { COLLATERAL_TOKEN_UI_PRECISION } from '../../constants';
import {
  useCalculateVeRaftAmount,
  useEstimateStakingApr,
  useUserRaftBptBalance,
  useUserVeRaftBalance,
} from '../../hooks';
import { formatDecimal } from '../../utils';
import { Button, Typography, ValueLabel } from '../shared';
import AmountInput from './AmountInput';
import Claim from './Claim';
import CurrentPosition from './CurrentPosition';
import FAQ from './FAQ';
import HowToLock from './HowToLock';
import PeriodPicker from './PeriodPicker';
import { StakePage } from './Stake';

interface AdjustProps {
  amountToLock: string;
  deadline?: Date;
  periodInYear?: number;
  onAmountChange: (value: string) => void;
  onDeadlineChange: (value: Date) => void;
  onPeriodChange: (value: number) => void;
  goToPage: (page: StakePage) => void;
}

const Adjust: FC<AdjustProps> = ({
  amountToLock,
  deadline,
  periodInYear,
  onAmountChange,
  onDeadlineChange,
  onPeriodChange,
  goToPage,
}) => {
  const userVeRaftBalance = useUserVeRaftBalance();
  const userRaftBptBalance = useUserRaftBptBalance();
  const { estimateStakingAprStatus, estimateStakingApr } = useEstimateStakingApr();
  const { calculateVeRaftAmountStatus, calculateVeRaftAmount } = useCalculateVeRaftAmount();

  const bptAmount = useMemo(() => Decimal.parse(amountToLock, 0), [amountToLock]);
  const unlockTime = useMemo(
    () => deadline ?? userVeRaftBalance?.unlockTime,
    [deadline, userVeRaftBalance?.unlockTime],
  );
  const veRaftAmount = useMemo(
    () => calculateVeRaftAmountStatus.result ?? Decimal.ZERO,
    [calculateVeRaftAmountStatus.result],
  );
  const totalVeRaftAmount = useMemo(
    () => (userVeRaftBalance?.veRaftBalance ?? Decimal.ZERO).add(veRaftAmount),
    [userVeRaftBalance?.veRaftBalance, veRaftAmount],
  );

  const totalVeRaftAmountFormatted = useMemo(
    () => formatDecimal(totalVeRaftAmount, COLLATERAL_TOKEN_UI_PRECISION),
    [totalVeRaftAmount],
  );
  const userRaftBptBalanceFormatted = useMemo(
    () => formatDecimal(userRaftBptBalance, COLLATERAL_TOKEN_UI_PRECISION),
    [userRaftBptBalance],
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
    if (bptAmount && unlockTime && isValid(unlockTime)) {
      estimateStakingApr({ bptAmount, unlockTime });
      calculateVeRaftAmount({ bptAmount, unlockTime });
    }
  }, [estimateStakingApr, bptAmount, unlockTime, calculateVeRaftAmount]);

  return (
    <div className="raft__stake raft__stake__adjust">
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
            token={RAFT_BPT_TOKEN}
            onChange={onAmountChange}
            onBalanceClick={onBalanceClick}
          />
          <PeriodPicker
            deadline={unlockTime ?? undefined}
            periodInYear={periodInYear}
            min={unlockTime ?? undefined}
            onDeadlineChange={onDeadlineChange}
            onPeriodChange={onPeriodChange}
          />
          <Typography className="raft__stake__label" variant="overline" weight="semi-bold" color="text-secondary">
            RESULTING VOTING POWER
          </Typography>
          <Typography className="raft__stake__value" variant="body" weight="medium" color="text-secondary">
            {totalVeRaftAmountFormatted ? (
              <>
                <TokenLogo type={`token-${VERAFT_TOKEN}`} size={20} />
                <ValueLabel
                  value={`${totalVeRaftAmountFormatted} ${VERAFT_TOKEN}`}
                  valueSize="body"
                  tickerSize="body2"
                />
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
        <CurrentPosition />
        <Claim />
        <FAQ defaultOpen={false} />
        <HowToLock defaultOpen={false} />
      </div>
    </div>
  );
};

export default memo(Adjust);
