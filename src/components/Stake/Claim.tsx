import { FC, memo, useCallback, useMemo } from 'react';
import { Button, Typography } from '../shared';
import CurrentPosition from './CurrentPosition';
import FAQ from './FAQ';
import HowToLock from './HowToLock';
import { StakePage } from './Stake';

interface ClaimProps {
  goToPage: (page: StakePage) => void;
}

const Claim: FC<ClaimProps> = ({ goToPage }) => {
  const goToDefault = useCallback(() => goToPage('default'), [goToPage]);
  const goToWithdraw = useCallback(() => goToPage('withdraw'), [goToPage]);
  const onClaim = useCallback(() => false, []);

  const positionButtons = useMemo(
    () => [
      <Button variant="secondary" size="large" onClick={goToDefault}>
        <Typography variant="button-label" weight="medium" color="text-secondary">
          Increase stake
        </Typography>
      </Button>,
      <Button variant="secondary" size="large" onClick={goToWithdraw}>
        <Typography variant="button-label" weight="medium" color="text-secondary">
          Withdraw
        </Typography>
      </Button>,
    ],
    [goToDefault, goToWithdraw],
  );

  return (
    <div className="raft__stake raft__stake__preview">
      <div className="raft__stake__main">
        <div className="raft__stake__main__container">
          <Typography className="raft__stake__title" variant="heading1" weight="medium">
            Claim rewards
          </Typography>
          <Typography className="raft__stake__subtitle" variant="body" color="text-secondary">
            Lorem ipsum dolor sit amet.
          </Typography>
          <Typography className="raft__stake__label" variant="overline" weight="semi-bold" color="text-secondary">
            TOTAL AMOUNT TO BE CLAIMED
          </Typography>
          <Typography className="raft__stake__value" variant="body" weight="medium" color="text-secondary">
            {'N/A'}
          </Typography>
          <div className="raft__stake__btn-container">
            <Button variant="primary" size="large" onClick={onClaim}>
              <Typography variant="button-label" color="text-primary-inverted">
                Claim
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

export default memo(Claim);
