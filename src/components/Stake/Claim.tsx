import { v4 as uuid } from 'uuid';
import { RAFT_TOKEN } from '@raft-fi/sdk';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { TokenLogo } from 'tempus-ui';
import { COLLATERAL_TOKEN_UI_PRECISION, WEEK_IN_MS } from '../../constants';
import { useClaimableRaftFromStakedBpt, useClaimRaftFromStakedBpt } from '../../hooks';
import { formatCurrency } from '../../utils';
import { Button, Loading, Typography, ValueLabel } from '../shared';

const Claim = () => {
  const claimableRaft = useClaimableRaftFromStakedBpt();
  const { claimRaftFromStakedBptStatus, claimRaftFromStakedBpt } = useClaimRaftFromStakedBpt();

  const [remainingDay, setRemainingDay] = useState<number>();
  const [remainingHour, setRemainingHour] = useState<number>();
  const [remainingMinute, setRemainingMinute] = useState<number>();
  const [actionButtonState, setActionButtonState] = useState<string>('default');

  const canClaim = useMemo(() => Boolean(claimableRaft?.gt(0)), [claimableRaft]);

  const claimableRaftFormatted = useMemo(
    () =>
      formatCurrency(claimableRaft, {
        currency: RAFT_TOKEN,
        fractionDigits: COLLATERAL_TOKEN_UI_PRECISION,
      }),
    [claimableRaft],
  );

  const onClaim = useCallback(() => {
    if (canClaim && claimableRaft) {
      const txnId = uuid();
      claimRaftFromStakedBpt({ claimAmount: claimableRaft, txnId });
    }
  }, [canClaim, claimRaftFromStakedBpt, claimableRaft]);

  /**
   * Update action button state based on current redeem request status
   */
  useEffect(() => {
    if (!claimRaftFromStakedBptStatus) {
      return;
    }

    if (claimRaftFromStakedBptStatus.pending) {
      setActionButtonState('loading');
    } else if (claimRaftFromStakedBptStatus.success) {
      setActionButtonState('success');
    } else {
      setActionButtonState('default');
    }
  }, [claimRaftFromStakedBptStatus]);

  useEffect(() => {
    const setRemaining = () => {
      const now = Date.now();
      const nextClaimTimestamp = Math.ceil(now / WEEK_IN_MS) * WEEK_IN_MS;
      const remainingSecond = Math.floor((nextClaimTimestamp - now) / 1000);
      const remainingMinute = Math.floor(remainingSecond / 60) % 60;
      const remainingHour = Math.floor(remainingSecond / 60 / 60) % 24;
      const remainingDay = Math.floor(remainingSecond / 60 / 60 / 24) % 7;

      setRemainingMinute(remainingMinute);
      setRemainingHour(remainingHour);
      setRemainingDay(remainingDay);
    };

    setRemaining();

    const id = setInterval(setRemaining, 60000);

    return () => clearInterval(id);
  }, []);

  return (
    <div className="raft__stake__claim">
      <Typography className="raft__stake__label" variant="overline" weight="semi-bold" color="text-secondary">
        CLAIMABLE REWARDS
      </Typography>
      <Typography className="raft__stake__value" variant="body" weight="medium">
        {claimableRaftFormatted ? (
          <>
            <TokenLogo type={`token-${RAFT_TOKEN}`} size={20} />
            <ValueLabel value={claimableRaftFormatted} valueSize="body" tickerSize="body2" />
          </>
        ) : (
          'N/A'
        )}
      </Typography>
      <div className="raft__stake__btn-container">
        <Button
          variant="primary"
          size="large"
          onClick={onClaim}
          disabled={!canClaim || actionButtonState === 'loading'}
        >
          {actionButtonState === 'loading' && <Loading />}
          <Typography variant="button-label" color="text-primary-inverted">
            Claim rewards
          </Typography>
        </Button>
      </div>
      <div className="raft__stake__value raft__stake__inline">
        <Typography variant="body2">Next weekly rewards available in </Typography>
        <Typography variant="body2" weight="bold">
          {remainingDay ?? '-'}d {remainingHour ?? '-'}h {remainingMinute ?? '-'}m
        </Typography>
      </div>
    </div>
  );
};

export default memo(Claim);
