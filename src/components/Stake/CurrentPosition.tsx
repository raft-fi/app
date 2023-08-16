import { Decimal } from '@tempusfinance/decimal';
import { addMilliseconds, startOfDay, format } from 'date-fns';
import { memo, useCallback, useMemo } from 'react';
import { TokenLogo } from 'tempus-ui';
import { COLLATERAL_TOKEN_UI_PRECISION, YEAR_IN_MS } from '../../constants';
import { formatDecimal, formatPercentage } from '../../utils';
import { Button, Typography, ValueLabel } from '../shared';

const CurrentPosition = () => {
  const veRaftAmount = useMemo(() => new Decimal(123456), []); // TODO: query from ve contract
  const stakePoolShare = useMemo(() => new Decimal(0.001234), []); // TODO: query from ve contract
  const unlockDate = useMemo(() => addMilliseconds(startOfDay(new Date()), YEAR_IN_MS), []); // TODO: query from ve contract

  const veRaftAmountFormatted = useMemo(
    () => formatDecimal(veRaftAmount, COLLATERAL_TOKEN_UI_PRECISION),
    [veRaftAmount],
  );
  const stakePoolShareFormatted = useMemo(() => formatPercentage(stakePoolShare), [stakePoolShare]);
  const unlockDateFormatted = useMemo(() => format(unlockDate, 'dd MMMM yyyy'), [unlockDate]);

  const onWithdraw = useCallback(() => false, []); // TODO: implement withdraw
  const onClaim = useCallback(() => false, []); // TODO: implement claim

  return (
    <div className="raft__stake__current-position">
      <Typography className="raft__stake__label" variant="overline" weight="semi-bold" color="text-secondary">
        RESULTING STAKE
      </Typography>
      <Typography className="raft__stake__value" variant="body" weight="medium">
        {veRaftAmountFormatted ? (
          <>
            <TokenLogo type="token-veRAFT" size={20} />
            <ValueLabel value={`${veRaftAmountFormatted} veRAFT`} valueSize="body" tickerSize="body2" />
          </>
        ) : (
          'N/A'
        )}
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
        {unlockDateFormatted}
      </Typography>
      <div className="raft__stake__btn-container">
        <Button variant="secondary" size="large" onClick={onWithdraw}>
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
