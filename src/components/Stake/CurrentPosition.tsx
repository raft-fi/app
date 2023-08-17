import { Decimal } from '@tempusfinance/decimal';
import { format } from 'date-fns';
import { FC, memo, ReactNode, useMemo } from 'react';
import { TokenLogo } from 'tempus-ui';
import { COLLATERAL_TOKEN_UI_PRECISION } from '../../constants';
import { useUserVeRaftBalance } from '../../hooks';
import { formatDecimal, formatPercentage } from '../../utils';
import { Typography, ValueLabel } from '../shared';

interface CurrentPositionProps {
  buttons: ReactNode[];
}

const CurrentPosition: FC<CurrentPositionProps> = ({ buttons }) => {
  const userVeRaftBalance = useUserVeRaftBalance();

  const bptLockedBalance = useMemo(
    () => userVeRaftBalance?.bptLockedBalance ?? null,
    [userVeRaftBalance?.bptLockedBalance],
  );
  const stakePoolShare = useMemo(
    () =>
      userVeRaftBalance?.veRaftBalance && userVeRaftBalance?.supply
        ? userVeRaftBalance.veRaftBalance.div(userVeRaftBalance?.supply)
        : null,
    [userVeRaftBalance?.veRaftBalance, userVeRaftBalance?.supply],
  );

  const bptLockedBalanceFormatted = useMemo(
    () => formatDecimal(bptLockedBalance ?? Decimal.ZERO, COLLATERAL_TOKEN_UI_PRECISION),
    [bptLockedBalance],
  );
  const stakePoolShareFormatted = useMemo(
    () => formatPercentage(stakePoolShare, { lessThanFormat: true }),
    [stakePoolShare],
  );
  const unlockDateFormatted = useMemo(
    () => (userVeRaftBalance?.unlockTime ? format(userVeRaftBalance.unlockTime, 'dd MMMM yyyy') : null),
    [userVeRaftBalance?.unlockTime],
  );

  return (
    <div className="raft__stake__current-position">
      <Typography className="raft__stake__label" variant="overline" weight="semi-bold" color="text-secondary">
        STAKED
      </Typography>
      <Typography className="raft__stake__value" variant="body" weight="medium">
        <TokenLogo type="token-B-80RAFT-20ETH" size={20} />
        <ValueLabel value={`${bptLockedBalanceFormatted} B-80RAFT-20ETH`} valueSize="body" tickerSize="body2" />
      </Typography>
      <Typography className="raft__stake__label" variant="overline" weight="semi-bold" color="text-secondary">
        MY veRAFT SHARE
      </Typography>
      <Typography className="raft__stake__value" variant="body" weight="medium">
        {stakePoolShareFormatted ?? 'N/A'}
      </Typography>
      <Typography className="raft__stake__label" variant="overline" weight="semi-bold" color="text-secondary">
        LOCKED UNTIL
      </Typography>
      <Typography className="raft__stake__value" variant="body" weight="medium">
        {unlockDateFormatted ?? 'N/A'}
      </Typography>
      <div className="raft__stake__btn-container">{buttons}</div>
    </div>
  );
};

export default memo(CurrentPosition);
