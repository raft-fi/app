import { FC, useMemo } from 'react';
import { Button, Typography, Loading } from '../shared';

import './PositionAction.scss';

interface PositionActionProps {
  actionButtonState: string;
  canBorrow: boolean;
  buttonLabel: string;
  walletConnected: boolean;
  onClick: () => void;
}

export const PositionAction: FC<PositionActionProps> = ({
  actionButtonState,
  buttonLabel,
  canBorrow,
  walletConnected,
  onClick,
}) => {
  const buttonDisabled = useMemo(
    () => actionButtonState === 'loading' || (walletConnected && !canBorrow),
    [canBorrow, actionButtonState, walletConnected],
  );

  return (
    <div className="raft__position-action">
      <Button variant="primary" size="large" onClick={onClick} disabled={buttonDisabled}>
        {actionButtonState === 'loading' && <Loading />}
        <Typography variant="button-label" color="text-primary-inverted">
          {buttonLabel}
        </Typography>
      </Button>
    </div>
  );
};
