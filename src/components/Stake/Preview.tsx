import { RAFT_BPT_TOKEN, VERAFT_TOKEN } from '@raft-fi/sdk';
import { Decimal } from '@tempusfinance/decimal';
import { format, startOfDay } from 'date-fns';
import { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { TokenLogo } from 'tempus-ui';
import { COLLATERAL_TOKEN_UI_PRECISION, WEEK_IN_MS, YEAR_IN_MS } from '../../constants';
import { useStakeBptForVeRaft, useUserVeRaftBalance } from '../../hooks';
import { formatDecimal } from '../../utils';
import { Button, Loading, Typography, ValueLabel } from '../shared';
import CurrentPosition from './CurrentPosition';
import FAQ from './FAQ';
import HowToLock from './HowToLock';
import { StakePage } from './Stake';

interface PreviewProps {
  amountToLock: string;
  deadline?: Date;
  goToPage: (page: StakePage) => void;
}

const Preview: FC<PreviewProps> = ({ amountToLock, deadline, goToPage }) => {
  const userVeRaftBalance = useUserVeRaftBalance();
  const { stakeBptForVeRaftStatus, stakeBptForVeRaft, stakeBptForVeRaftStepsStatus, requestStakeBptForVeRaftStep } =
    useStakeBptForVeRaft();

  const [actionButtonState, setActionButtonState] = useState<string>('default');

  const bptAmount = useMemo(() => Decimal.parse(amountToLock, 0), [amountToLock]);
  const unlockTime = useMemo(
    () => deadline ?? userVeRaftBalance?.unlockTime,
    [deadline, userVeRaftBalance?.unlockTime],
  );
  const veRaftAmount = useMemo(() => {
    if (!unlockTime) {
      return Decimal.ZERO;
    }

    const today = startOfDay(new Date());
    // period is floored by week (VotingEscrow.vy#L77)
    const periodInMs = Math.floor((unlockTime.getTime() - today.getTime()) / WEEK_IN_MS) * WEEK_IN_MS;
    const period = new Decimal(periodInMs).div(YEAR_IN_MS);

    return bptAmount.mul(period);
  }, [bptAmount, unlockTime]);
  const totalVeRaftAmount = useMemo(
    () => (userVeRaftBalance?.veRaftBalance ?? Decimal.ZERO).add(veRaftAmount),
    [userVeRaftBalance?.veRaftBalance, veRaftAmount],
  );
  const hasPosition = useMemo(
    () => Boolean(userVeRaftBalance?.bptLockedBalance.gt(0)),
    [userVeRaftBalance?.bptLockedBalance],
  );

  const unlockTimeFormatted = useMemo(() => (unlockTime ? format(unlockTime, 'dd MMMM yyyy') : null), [unlockTime]);
  const bptAmountFormatted = useMemo(() => formatDecimal(bptAmount, COLLATERAL_TOKEN_UI_PRECISION), [bptAmount]);
  const totalVeRaftAmountFormatted = useMemo(
    () => formatDecimal(totalVeRaftAmount, COLLATERAL_TOKEN_UI_PRECISION),
    [totalVeRaftAmount],
  );

  const goToDefault = useCallback(() => goToPage('default'), [goToPage]);
  const goToWithdraw = useCallback(() => goToPage('withdraw'), [goToPage]);
  const goToClaim = useCallback(() => goToPage('claim'), [goToPage]);
  const onStake = useCallback(() => {
    stakeBptForVeRaft?.();
  }, [stakeBptForVeRaft]);

  const previewTitle = useMemo(() => {
    switch (stakeBptForVeRaftStepsStatus.result?.type) {
      case 'approve':
      case 'stake-new':
        return 'Start staking now';
      case 'stake-increase':
        return 'Increase RAFT rewards';
      case 'stake-extend':
        return 'Extend your staking period';
    }

    return '';
  }, [stakeBptForVeRaftStepsStatus.result?.type]);

  const previewDesc = useMemo(() => {
    switch (stakeBptForVeRaftStepsStatus.result?.type) {
      case 'approve':
      case 'stake-new':
      case 'stake-increase':
        return 'Review the summary below and proceed with increasing your staking amount.';
      case 'stake-extend':
        return 'Review the summary below and proceed with increasing your staking period.';
    }

    return '';
  }, [stakeBptForVeRaftStepsStatus.result?.type]);

  const buttonLabel = useMemo(() => {
    switch (stakeBptForVeRaftStepsStatus.result?.type) {
      case 'approve':
        return stakeBptForVeRaftStatus.pending ? `Approving ${RAFT_BPT_TOKEN}` : `Approve ${RAFT_BPT_TOKEN}`;
      case 'stake-new':
        return stakeBptForVeRaftStatus.pending ? 'Staking' : 'Stake';
      case 'stake-increase':
        return stakeBptForVeRaftStatus.pending ? 'Increasing stake' : 'Increase stake';
      case 'stake-extend':
        return stakeBptForVeRaftStatus.pending ? 'Extending lock period' : 'Extend lock period';
    }

    return '';
  }, [stakeBptForVeRaftStatus.pending, stakeBptForVeRaftStepsStatus.result?.type]);

  const positionButtons = useMemo(
    () => [
      <Button
        key="btn-withdraw"
        variant="secondary"
        size="large"
        onClick={goToWithdraw}
        disabled={!hasPosition || actionButtonState === 'loading'}
      >
        <Typography variant="button-label" weight="medium" color="text-secondary">
          Withdraw
        </Typography>
      </Button>,
      <Button
        key="btn-claim"
        variant="secondary"
        size="large"
        onClick={goToClaim}
        disabled={!hasPosition || actionButtonState === 'loading'}
      >
        <Typography variant="button-label" weight="medium" color="text-secondary">
          Claim
        </Typography>
      </Button>,
    ],
    [actionButtonState, goToClaim, goToWithdraw, hasPosition],
  );

  useEffect(() => {
    if (requestStakeBptForVeRaftStep && unlockTime) {
      requestStakeBptForVeRaftStep({
        bptAmount,
        unlockTime,
      });
    }
  }, [bptAmount, requestStakeBptForVeRaftStep, unlockTime]);

  useEffect(() => {
    if (stakeBptForVeRaftStatus.pending || stakeBptForVeRaftStepsStatus.pending) {
      setActionButtonState('loading');
    } else if (stakeBptForVeRaftStatus.success) {
      setActionButtonState('success');
    } else {
      setActionButtonState('default');
    }
  }, [stakeBptForVeRaftStatus.pending, stakeBptForVeRaftStatus.success, stakeBptForVeRaftStepsStatus.pending]);

  useEffect(() => {
    if (stakeBptForVeRaftStatus.success && !stakeBptForVeRaftStepsStatus.result?.type) {
      goToPage('default');
    }
  }, [goToPage, stakeBptForVeRaftStatus.success, stakeBptForVeRaftStepsStatus.result?.type]);

  return (
    <div className="raft__stake raft__stake__preview">
      <div className="raft__stake__main">
        <div className="raft__stake__main__container">
          <Typography className="raft__stake__title" variant="heading1" weight="medium">
            {previewTitle}
          </Typography>
          <Typography className="raft__stake__subtitle" variant="body" color="text-secondary">
            {previewDesc}
          </Typography>
          <Typography className="raft__stake__label" variant="overline" weight="semi-bold" color="text-secondary">
            TOTAL AMOUNT TO BE STAKED
          </Typography>
          <Typography className="raft__stake__value" variant="body" weight="medium" color="text-secondary">
            {bptAmountFormatted ? (
              <>
                <TokenLogo type={`token-${RAFT_BPT_TOKEN}`} size={20} />
                <ValueLabel value={`${bptAmountFormatted} ${RAFT_BPT_TOKEN}`} valueSize="body" tickerSize="body2" />
              </>
            ) : (
              'N/A'
            )}
          </Typography>
          <Typography className="raft__stake__label" variant="overline" weight="semi-bold" color="text-secondary">
            LOCKED UNTIL
          </Typography>
          <Typography className="raft__stake__value" variant="body" weight="medium">
            {unlockTimeFormatted ?? '---'}
          </Typography>
          <Typography className="raft__stake__label" variant="overline" weight="semi-bold" color="text-secondary">
            TOTAL VOTING ESCROW
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
          <div className="raft__stake__btn-container">
            <Button variant="secondary" size="large" onClick={goToDefault} disabled={actionButtonState === 'loading'}>
              <Typography variant="button-label" color="text-secondary">
                Back
              </Typography>
            </Button>
            <Button variant="primary" size="large" onClick={onStake} disabled={actionButtonState === 'loading'}>
              {actionButtonState === 'loading' && <Loading />}
              <Typography variant="button-label" color="text-primary-inverted">
                {buttonLabel}
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

export default memo(Preview);
