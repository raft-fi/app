import { Decimal } from '@tempusfinance/decimal';
import { format, startOfDay } from 'date-fns';
import { FC, memo, useCallback, useMemo } from 'react';
import { TokenLogo } from 'tempus-ui';
import { COLLATERAL_TOKEN_UI_PRECISION, YEAR_IN_MS } from '../../constants';
import { formatDecimal } from '../../utils';
import { Button, Typography, ValueLabel } from '../shared';
import CurrentPosition from './CurrentPosition';
import FAQ from './FAQ';
import HowToLock from './HowToLock';

interface PreviewProps {
  amountToLock: string;
  deadline?: Date;
  onPrevStep: () => void;
  onNextStep: () => void;
}

const Preview: FC<PreviewProps> = ({ amountToLock, deadline, onPrevStep, onNextStep }) => {
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

  const deadlineFormatted = useMemo(() => (deadline ? format(deadline, 'dd MMMM yyyy') : null), [deadline]);
  const bptAmountFormatted = useMemo(() => formatDecimal(bptAmount, COLLATERAL_TOKEN_UI_PRECISION), [bptAmount]);
  const veRaftAmountFormatted = useMemo(
    () => formatDecimal(veRaftAmount, COLLATERAL_TOKEN_UI_PRECISION),
    [veRaftAmount],
  );

  const onStake = useCallback(() => {
    onNextStep();
  }, [onNextStep]);

  return (
    <div className="raft__stake raft__stake__preview">
      <div className="raft__stake__main">
        <div className="raft__stake__main__container">
          <Typography className="raft__stake__title" variant="heading1" weight="medium">
            Title
          </Typography>
          <Typography className="raft__stake__subtitle" variant="body" color="text-secondary">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
            dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco.
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
            RESULTING STAKE
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
            <Button variant="secondary" size="large" onClick={onPrevStep}>
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
        <CurrentPosition />
        <FAQ defaultOpen={false} />
        <HowToLock defaultOpen={false} />
      </div>
    </div>
  );
};

export default memo(Preview);
