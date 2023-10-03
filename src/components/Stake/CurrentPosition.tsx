import { VERAFT_TOKEN } from '@raft-fi/sdk';
import { Decimal } from '@tempusfinance/decimal';
import { format } from 'date-fns';
import { memo, useMemo } from 'react';
import { TokenLogo } from 'tempus-ui';
import { COLLATERAL_TOKEN_UI_PRECISION } from '../../constants';
import { useUserVeRaftBalance } from '../../hooks';
import { formatDecimal } from '../../utils';
import { Typography, ValueLabel } from '../shared';

const CurrentPosition = () => {
  const userVeRaftBalance = useUserVeRaftBalance();

  const veRaftBalance = useMemo(() => userVeRaftBalance?.veRaftBalance ?? null, [userVeRaftBalance?.veRaftBalance]);

  const veRaftBalanceFormatted = useMemo(
    () => formatDecimal(veRaftBalance ?? Decimal.ZERO, COLLATERAL_TOKEN_UI_PRECISION),
    [veRaftBalance],
  );
  const unlockDateFormatted = useMemo(
    () => (userVeRaftBalance?.unlockTime ? format(userVeRaftBalance.unlockTime, 'dd MMMM yyyy') : null),
    [userVeRaftBalance?.unlockTime],
  );

  return (
    <div className="raft__stake__current-position">
      <Typography className="raft__stake__label" variant="overline" weight="semi-bold" color="text-secondary">
        CURRENT VOTING POWER
      </Typography>
      <Typography className="raft__stake__value" variant="body" weight="medium">
        <TokenLogo type={`token-${VERAFT_TOKEN}`} size={20} />
        <ValueLabel value={`${veRaftBalanceFormatted} ${VERAFT_TOKEN}`} valueSize="body" tickerSize="body2" />
      </Typography>
      <Typography className="raft__stake__label" variant="overline" weight="semi-bold" color="text-secondary">
        CURRENT STAKING PERIOD
      </Typography>
      <Typography className="raft__stake__value" variant="body" weight="medium">
        {unlockDateFormatted ?? 'N/A'}
      </Typography>
    </div>
  );
};

export default memo(CurrentPosition);
