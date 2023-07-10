import { usePosition } from '../../hooks';
import AdjustLeveragePosition from '../AdjustLeveragePosition';
import OpenLeveragePosition from '../OpenLeveragePosition';
import YourPositionPlaceholder from '../YourPositionPlaceholder';

import './LeverageDashboard.scss';

const LeverageDashboard = () => {
  const position = usePosition();

  return (
    <div className="raft__leverageDashboard">
      <YourPositionPlaceholder />
      <OpenLeveragePosition />
      {/* position && <AdjustLeveragePosition position={position} /> */}
    </div>
  );
};
export default LeverageDashboard;
