import { v4 as uuid } from 'uuid';
import { RAFT_TOKEN } from '@raft-fi/sdk';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { TokenLogo } from '@tempusfinance/common-ui';
import { COLLATERAL_TOKEN_UI_PRECISION } from '../../constants';
import { useClaimableRaftFromStakedBpt, useClaimRaftFromStakedBpt } from '../../hooks';
import { formatCurrency } from '../../utils';
import { Button, Loading, Typography, ValueLabel } from '../shared';

const Claim = () => {
  const claimableRaft = useClaimableRaftFromStakedBpt();
  const { claimRaftFromStakedBptStatus, claimRaftFromStakedBpt } = useClaimRaftFromStakedBpt();

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
    </div>
  );
};

export default memo(Claim);
