import { FC, useMemo } from 'react';
import { Button, Loading, Typography } from '../shared';

import './LeveragePositionAction.scss';

interface LeveragePositionActionProps {
  actionButtonState: string;
  canLeverage: boolean;
  buttonLabel: string;
  walletConnected: boolean;
  onClick: () => void;
}

const LeveragePositionAction: FC<LeveragePositionActionProps> = ({
  actionButtonState,
  buttonLabel,
  canLeverage,
  walletConnected,
  onClick,
}) => {
  const buttonDisabled = useMemo(
    () => actionButtonState === 'loading' || (walletConnected && !canLeverage),
    [canLeverage, actionButtonState, walletConnected],
  );

  return (
    <div className="raft__leveragePositionAction">
      <Button variant="primary" size="large" onClick={onClick} disabled={buttonDisabled}>
        {actionButtonState === 'loading' && <Loading />}
        <Typography variant="button-label" color="text-primary-inverted">
          {buttonLabel}
        </Typography>
      </Button>
    </div>
  );
};
export default LeveragePositionAction;
