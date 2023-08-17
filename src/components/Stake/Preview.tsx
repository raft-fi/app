import { Decimal } from '@tempusfinance/decimal';
import { format, startOfDay } from 'date-fns';
import { FC, memo, useCallback, useMemo } from 'react';
import { TokenLogo } from 'tempus-ui';
import { COLLATERAL_TOKEN_UI_PRECISION, YEAR_IN_MS } from '../../constants';
import { useUserVeRaftBalance } from '../../hooks';
import { formatDecimal } from '../../utils';
import { Button, Typography, ValueLabel } from '../shared';
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

  const bptAmount = useMemo(() => Decimal.parse(amountToLock, 0), [amountToLock]);
  const veRaftAmount = useMemo(() => {
    if (!deadline) {
      return Decimal.ZERO;
    }

    const today = startOfDay(new Date());
    const periodInMs = new Decimal(deadline.getTime()).sub(today.getTime());
    const period = periodInMs.div(YEAR_IN_MS);

    return bptAmount.mul(period);
  }, [bptAmount, deadline]);
  const hasPosition = useMemo(
    () => Boolean(userVeRaftBalance?.bptLockedBalance.gt(0)),
    [userVeRaftBalance?.bptLockedBalance],
  );

  const deadlineFormatted = useMemo(() => (deadline ? format(deadline, 'dd MMMM yyyy') : null), [deadline]);
  const bptAmountFormatted = useMemo(() => formatDecimal(bptAmount, COLLATERAL_TOKEN_UI_PRECISION), [bptAmount]);
  const veRaftAmountFormatted = useMemo(
    () => formatDecimal(veRaftAmount, COLLATERAL_TOKEN_UI_PRECISION),
    [veRaftAmount],
  );

  const goToDefault = useCallback(() => goToPage('default'), [goToPage]);
  const goToWithdraw = useCallback(() => goToPage('withdraw'), [goToPage]);
  const goToClaim = useCallback(() => goToPage('claim'), [goToPage]);
  const onStake = useCallback(() => {
    goToPage('withdraw');
  }, [goToPage]);

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
    <div className="raft__stake raft__stake__preview">
      <div className="raft__stake__main">
        <div className="raft__stake__main__container">
          <Typography className="raft__stake__title" variant="heading1" weight="medium">
            Start receiving RAFT rewards
          </Typography>
          <Typography className="raft__stake__subtitle" variant="body" color="text-secondary">
            Review the summary below before proceeding with staking your RAFT Balancer LP tokens to obtain governance
            rights and earn more RAFT.
          </Typography>
          <Typography className="raft__stake__label" variant="overline" weight="semi-bold" color="text-secondary">
            TOTAL AMOUNT TO BE STAKED
          </Typography>
          <Typography className="raft__stake__value" variant="body" weight="medium" color="text-secondary">
            {bptAmountFormatted ? (
              <>
                <TokenLogo type="token-B-80RAFT-20ETH" size={20} />
                <ValueLabel value={`${bptAmountFormatted} B-80RAFT-20WETH`} valueSize="body" tickerSize="body2" />
              </>
            ) : (
              'N/A'
            )}
          </Typography>
          <Typography className="raft__stake__label" variant="overline" weight="semi-bold" color="text-secondary">
            LOCKED UNTIL
          </Typography>
          <Typography className="raft__stake__value" variant="body" weight="medium">
            {deadlineFormatted ?? '---'}
          </Typography>
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
          <div className="raft__stake__btn-container">
            <Button variant="secondary" size="large" onClick={goToDefault}>
              <Typography variant="button-label" color="text-secondary">
                Back
              </Typography>
            </Button>
            <Button variant="primary" size="large" onClick={onStake}>
              <Typography variant="button-label" color="text-primary-inverted">
                Stake
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
