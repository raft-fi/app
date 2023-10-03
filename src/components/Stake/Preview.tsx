import { RAFT_BPT_TOKEN, VERAFT_TOKEN } from '@raft-fi/sdk';
import { Decimal } from '@tempusfinance/decimal';
import { format, startOfDay } from 'date-fns';
import { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { TokenLogo } from 'tempus-ui';
import { COLLATERAL_TOKEN_UI_PRECISION, WEEK_IN_MS, YEAR_IN_MS } from '../../constants';
import { useStakeBptForVeRaft } from '../../hooks';
import { formatDecimal } from '../../utils';
import { Button, Loading, Typography, ValueLabel } from '../shared';
import FAQ from './FAQ';
import HowToLock from './HowToLock';
import { StakePage } from './Stake';

interface PreviewProps {
  amountToLock: string;
  deadline?: Date;
  goToPage: (page: StakePage) => void;
}

const Preview: FC<PreviewProps> = ({ amountToLock, deadline, goToPage }) => {
  const { stakeBptForVeRaftStatus, stakeBptForVeRaft, stakeBptForVeRaftStepsStatus, requestStakeBptForVeRaftStep } =
    useStakeBptForVeRaft();

  const [actionButtonState, setActionButtonState] = useState<string>('default');

  const bptAmount = useMemo(() => Decimal.parse(amountToLock, 0), [amountToLock]);
  const veRaftAmount = useMemo(() => {
    if (!deadline) {
      return Decimal.ZERO;
    }

    const today = startOfDay(new Date());
    // period is floored by week (VotingEscrow.vy#L77)
    const periodInMs = Math.floor((deadline.getTime() - today.getTime()) / WEEK_IN_MS) * WEEK_IN_MS;
    const period = new Decimal(periodInMs).div(YEAR_IN_MS);

    return bptAmount.mul(period);
  }, [bptAmount, deadline]);

  const unlockTimeFormatted = useMemo(() => (deadline ? format(deadline, 'dd MMMM yyyy') : null), [deadline]);
  const bptAmountFormatted = useMemo(() => formatDecimal(bptAmount, COLLATERAL_TOKEN_UI_PRECISION), [bptAmount]);
  const veRaftAmountFormatted = useMemo(
    () => formatDecimal(veRaftAmount, COLLATERAL_TOKEN_UI_PRECISION),
    [veRaftAmount],
  );

  const goToDefault = useCallback(() => goToPage('default'), [goToPage]);
  const onStake = useCallback(() => {
    stakeBptForVeRaft?.();
  }, [stakeBptForVeRaft]);

  const buttonLabel = useMemo(() => {
    switch (stakeBptForVeRaftStepsStatus.result?.type) {
      case 'approve':
        return stakeBptForVeRaftStatus.pending ? `Approving ${RAFT_BPT_TOKEN}` : `Approve ${RAFT_BPT_TOKEN}`;
      case 'stake-new':
      default:
        return stakeBptForVeRaftStatus.pending ? 'Staking' : 'Stake';
    }
  }, [stakeBptForVeRaftStatus.pending, stakeBptForVeRaftStepsStatus.result?.type]);

  useEffect(() => {
    if (requestStakeBptForVeRaftStep && deadline) {
      requestStakeBptForVeRaftStep({
        bptAmount,
        unlockTime: deadline,
      });
    }
  }, [bptAmount, requestStakeBptForVeRaftStep, deadline]);

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
            Start staking now
          </Typography>
          <Typography className="raft__stake__subtitle" variant="body" color="text-secondary">
            Review the summary below and proceed with staking your RAFT BPT to gain governance rights and earn RAFT
            rewards.
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
            STAKED UNTIL
          </Typography>
          <Typography className="raft__stake__value" variant="body" weight="medium">
            {unlockTimeFormatted ?? '---'}
          </Typography>
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
          <div className="raft__stake__btn-container">
            <Button variant="secondary" size="large" onClick={goToDefault} disabled={actionButtonState === 'loading'}>
              <Typography variant="button-label" color="text-secondary">
                Back
              </Typography>
            </Button>
            <Button
              variant="primary"
              size="large"
              onClick={onStake}
              disabled={actionButtonState === 'loading' || !stakeBptForVeRaftStepsStatus.result?.type}
            >
              {actionButtonState === 'loading' && <Loading />}
              <Typography variant="button-label" color="text-primary-inverted">
                {buttonLabel}
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

export default memo(Preview);
