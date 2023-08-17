import { Decimal } from '@tempusfinance/decimal';
import { format } from 'date-fns';
import { memo, useCallback, useMemo } from 'react';
import { TokenLogo } from 'tempus-ui';
import { COLLATERAL_TOKEN_UI_PRECISION } from '../../constants';
import { useUserVeRaftBalance } from '../../hooks';
import { formatDecimal, formatPercentage } from '../../utils';
import { Button, Typography, ValueLabel } from '../shared';

const CurrentPosition = () => {
  const userVeRaftBalance = useUserVeRaftBalance();

  const veRaftBalance = useMemo(() => userVeRaftBalance?.veRaftBalance ?? null, [userVeRaftBalance?.veRaftBalance]);
  const stakePoolShare = useMemo(
    () =>
      userVeRaftBalance?.veRaftBalance && userVeRaftBalance?.supply
        ? userVeRaftBalance.veRaftBalance.div(userVeRaftBalance?.supply)
        : null,
    [userVeRaftBalance?.veRaftBalance, userVeRaftBalance?.supply],
  );

  const veRaftAmountFormatted = useMemo(
    () => formatDecimal(veRaftBalance ?? Decimal.ZERO, COLLATERAL_TOKEN_UI_PRECISION),
    [veRaftBalance],
  );
  const stakePoolShareFormatted = useMemo(() => formatPercentage(stakePoolShare), [stakePoolShare]);
  const unlockDateFormatted = useMemo(
    () => (userVeRaftBalance?.unlockTime ? format(userVeRaftBalance.unlockTime, 'dd MMMM yyyy') : null),
    [userVeRaftBalance?.unlockTime],
  );

  // can withdraw only have staked position and lock time already expired
  const canWithdraw = useMemo(
    () =>
      userVeRaftBalance?.unlockTime &&
      userVeRaftBalance.veRaftBalance.gt(0) &&
      userVeRaftBalance.unlockTime.getTime() < Date.now(),
    [userVeRaftBalance?.veRaftBalance, userVeRaftBalance?.unlockTime],
  );

  const onWithdraw = useCallback(() => false, []); // TODO: implement withdraw
  const onClaim = useCallback(() => false, []); // TODO: implement claim

  return (
    <div className="raft__stake__current-position">
      <Typography className="raft__stake__label" variant="overline" weight="semi-bold" color="text-secondary">
        RESULTING STAKE
      </Typography>
      <Typography className="raft__stake__value" variant="body" weight="medium">
        <TokenLogo type="token-veRAFT" size={20} />
        <ValueLabel value={`${veRaftAmountFormatted} veRAFT`} valueSize="body" tickerSize="body2" />
      </Typography>
      <Typography className="raft__stake__label" variant="overline" weight="semi-bold" color="text-secondary">
        STAKE POOL SHARE
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
      <div className="raft__stake__btn-container">
        <Button variant="secondary" size="large" onClick={onWithdraw} disabled={!canWithdraw}>
          <Typography variant="button-label" weight="medium" color="text-secondary">
            Withdraw
          </Typography>
        </Button>
        <Button variant="secondary" size="large" onClick={onClaim}>
          <Typography variant="button-label" weight="medium" color="text-secondary">
            Claim
          </Typography>
        </Button>
      </div>
    </div>
  );
};

export default memo(CurrentPosition);
