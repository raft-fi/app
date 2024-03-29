import { RaftToken, RAFT_BPT_TOKEN, VERAFT_TOKEN } from '@raft-fi/sdk';
import { Decimal, DecimalFormat } from '@tempusfinance/decimal';
import { isValid } from 'date-fns';
import { FC, memo, useCallback, useEffect, useMemo } from 'react';
import { TokenLogo } from 'tempus-ui';
import { COLLATERAL_TOKEN_UI_PRECISION, INPUT_PREVIEW_DIGITS } from '../../constants';
import {
  useCalculateVeRaftAmount,
  useEstimateStakingApr,
  useUserRaftBptBalance,
  useUserVeRaftBalance,
} from '../../hooks';
import { formatCurrency } from '../../utils';
import { Button, CurrencyInput, Typography, ValueLabel } from '../shared';
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

  const veRaftAmountFormatted = useMemo(
    () =>
      veRaftAmount.gte(0)
        ? formatCurrency(veRaftAmount, {
            currency: VERAFT_TOKEN,
            fractionDigits: COLLATERAL_TOKEN_UI_PRECISION,
          })
        : null,
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

  const canPreview = useMemo(() => {
    // if staking period is not adjusted, check whether input amount > 0
    if (!deadline) {
      return bptAmount.gt(0);
    }

    // check whether staking period is prior than the current one
    if (bptAmount.gt(0)) {
      return isValid(deadline) && userVeRaftBalance?.unlockTime && deadline >= userVeRaftBalance?.unlockTime;
    }

    // check whether staking period is extending
    return userVeRaftBalance?.unlockTime && RaftToken.isExtendingStakeBpt(userVeRaftBalance.unlockTime, deadline);
  }, [bptAmount, deadline, userVeRaftBalance?.unlockTime]);

  const onBalanceClick = useCallback(() => {
    if (userRaftBptBalance) {
      onAmountChange(userRaftBptBalance.toString());
    }
  }, [onAmountChange, userRaftBptBalance]);

  const goToPreview = useCallback(() => goToPage('preview'), [goToPage]);

  useEffect(() => {
    if (bptAmount && userVeRaftBalance?.bptLockedBalance && unlockTime && isValid(unlockTime)) {
      estimateStakingApr({ bptAmount, unlockTime });
      calculateVeRaftAmount({ bptAmount: bptAmount.add(userVeRaftBalance.bptLockedBalance), unlockTime });
    }
  }, [estimateStakingApr, bptAmount, unlockTime, calculateVeRaftAmount, userVeRaftBalance?.bptLockedBalance]);

  return (
    <div className="raft__stake raft__stake__adjust">
      <div className="raft__stake__main">
        <div className="raft__stake__main__container">
          <Typography className="raft__stake__title" variant="heading1" weight="medium">
            Adjust stake
          </Typography>
          <Typography className="raft__stake__subtitle" variant="body" color="text-secondary">
            Increase your voting power by staking more RAFT BPT and extending your staking period.
          </Typography>
          <CurrencyInput
            label="ADDITIONAL STAKE"
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
            deadline={unlockTime ?? undefined}
            periodInYear={periodInYear}
            min={userVeRaftBalance?.unlockTime ?? undefined}
            onDeadlineChange={onDeadlineChange}
            onPeriodChange={onPeriodChange}
          />
          <Typography className="raft__stake__label" variant="overline" weight="semi-bold" color="text-secondary">
            RESULTING VOTING POWER
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
        <CurrentPosition />
        <Claim />
        <FAQ defaultOpen={false} />
        <HowToLock defaultOpen={false} />
      </div>
    </div>
  );
};

export default memo(Adjust);
