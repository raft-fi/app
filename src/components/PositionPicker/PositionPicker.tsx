import { Navigate } from 'react-router-dom';
import { TokenLogo } from 'tempus-ui';
import { Icon, Typography } from '../shared';
import PositionPickerItem from './PositionPickerItem';
import { usePosition } from '../../hooks';

import './PositionPicker.scss';

const PositionPicker = () => {
  const position = usePosition();

  /**
   * If user has position, redirect to generate or leverage page
   */
  if (position?.hasPosition && position.principalCollateralBalance) {
    return <Navigate to="/leverage" />;
  } else if (position?.hasPosition) {
    return <Navigate to="/generate" />;
  }

  // TODO: we load usePosition to check whether user has position here? do we need loading component?
  return (
    <div className="raft__positionPicker">
      <Typography variant="heading2" weight="medium">
        Open Position
      </Typography>
      <Typography className="raft__positionPickerDescription" variant="body2" color="text-secondary">
        Choose between the two options below to get started with Raft.
      </Typography>
      <div className="raft__positionPickerItems">
        <PositionPickerItem
          icon={<TokenLogo type="token-R" />}
          title="Generate R"
          description="Deposit collateral to generate R"
          path="/generate"
        />
        <PositionPickerItem
          icon={<Icon variant="stars" />}
          title="Leverage"
          description="Leverage up in one click"
          path="/leverage"
        />
      </div>
    </div>
  );
};
export default PositionPicker;
