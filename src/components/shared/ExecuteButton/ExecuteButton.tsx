import { FC, useMemo } from 'react';
import { Button, Typography, Loading } from '..';

import './ExecuteButton.scss';

interface PositionActionProps {
  actionButtonState: string;
  canExecute: boolean;
  buttonLabel: string;
  walletConnected: boolean;
  onClick: () => void;
}

export const ExecuteButton: FC<PositionActionProps> = ({
  actionButtonState,
  buttonLabel,
  canExecute,
  walletConnected,
  onClick,
}) => {
  const buttonDisabled = useMemo(
    () => actionButtonState === 'loading' || (walletConnected && !canExecute),
    [canExecute, actionButtonState, walletConnected],
  );

  return (
    <div className="raft__executeButton">
      <Button variant="primary" size="large" onClick={onClick} disabled={buttonDisabled}>
        {actionButtonState === 'loading' && <Loading />}
        <Typography variant="button-label" color="text-primary-inverted">
          {buttonLabel}
        </Typography>
      </Button>
    </div>
  );
};
