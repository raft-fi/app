import { TokenLogo } from 'tempus-ui';
import { Icon, Typography } from '../shared';
import './PositionPicker.scss';
import PositionPickerItem from './PositionPickerItem';

const PositionPicker = () => {
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
