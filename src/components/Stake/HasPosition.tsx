import { RAFT_BPT_TOKEN, VERAFT_TOKEN } from '@raft-fi/sdk';
import { format } from 'date-fns';
import { FC, memo, useCallback, useMemo } from 'react';
import { TokenLogo } from 'tempus-ui';
import { COLLATERAL_TOKEN_UI_PRECISION } from '../../constants';
import { useUserVeRaftBalance } from '../../hooks';
import { formatDecimal } from '../../utils';
import { Button, Typography, ValueLabel } from '../shared';
import FAQ from './FAQ';
import HowToLock from './HowToLock';
import { StakePage } from './Stake';

interface HasPositionProps {
  goToPage: (page: StakePage) => void;
}

const HasPosition: FC<HasPositionProps> = ({ goToPage }) => {
  const userVeRaftBalance = useUserVeRaftBalance();

  const bptLockedBalance = useMemo(
    () => userVeRaftBalance?.bptLockedBalance ?? null,
    [userVeRaftBalance?.bptLockedBalance],
  );
  const veRaftBalance = useMemo(() => userVeRaftBalance?.veRaftBalance ?? null, [userVeRaftBalance?.veRaftBalance]);
  const unlockTime = useMemo(() => userVeRaftBalance?.unlockTime ?? null, [userVeRaftBalance?.unlockTime]);

  const bptLockedBalanceFormatted = useMemo(
    () => formatDecimal(bptLockedBalance, COLLATERAL_TOKEN_UI_PRECISION),
    [bptLockedBalance],
  );
  const veRaftBalanceFormatted = useMemo(
    () => formatDecimal(veRaftBalance, COLLATERAL_TOKEN_UI_PRECISION),
    [veRaftBalance],
  );
  const unlockTimeFormatted = useMemo(() => (unlockTime ? format(unlockTime, 'dd MMMM yyyy') : null), [unlockTime]);

  const goToAdjust = useCallback(() => goToPage('adjust'), [goToPage]);

  return (
    <div className="raft__stake raft__stake__has-position">
      <div className="raft__stake__main">
        <div className="raft__stake__main__container">
          <Typography className="raft__stake__title" variant="heading1" weight="medium">
            Your stake
          </Typography>
          <Typography className="raft__stake__subtitle" variant="body" color="text-secondary">
            Below is a summary of your current voting power for Raft governance.
          </Typography>
          <Typography className="raft__stake__label" variant="overline" weight="semi-bold" color="text-secondary">
            STAKED
          </Typography>
          <Typography className="raft__stake__value" variant="body" weight="medium" color="text-secondary">
            {bptLockedBalanceFormatted ? (
              <>
                <TokenLogo type={`token-${RAFT_BPT_TOKEN}`} size={20} />
                <ValueLabel
                  value={`${bptLockedBalanceFormatted} ${RAFT_BPT_TOKEN}`}
                  valueSize="body"
                  tickerSize="body2"
                />
              </>
            ) : (
              'N/A'
            )}
          </Typography>
          <Typography className="raft__stake__label" variant="overline" weight="semi-bold" color="text-secondary">
            TOTAL VOTING POWER
          </Typography>
          <Typography className="raft__stake__value" variant="body" weight="medium" color="text-secondary">
            {veRaftBalanceFormatted ? (
              <>
                <TokenLogo type={`token-${VERAFT_TOKEN}`} size={20} />
                <ValueLabel value={`${veRaftBalanceFormatted} ${VERAFT_TOKEN}`} valueSize="body" tickerSize="body2" />
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
          <div className="raft__stake__btn-container">
            <Button variant="secondary" size="large" onClick={goToAdjust}>
              <Typography variant="button-label" color="text-secondary">
                Adjust stake
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

export default memo(HasPosition);
