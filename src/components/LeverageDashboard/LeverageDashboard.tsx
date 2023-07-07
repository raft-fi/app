import { usePosition } from '../../hooks';
import AdjustLeveragePosition from '../AdjustLeveragePosition';
import OpenLeveragePosition from '../OpenLeveragePosition';
import YourPositionPlaceholder from '../YourPositionPlaceholder';

import './LeverageDashboard.scss';

const LeverageDashboard = () => {
  const position = usePosition();

  // TODO - Show adjust only if user has borrowed and has a leverage position
  if (!position) {
    return null;
  }

  return (
    <div className="raft__leverageDashboard">
      <YourPositionPlaceholder />
      <OpenLeveragePosition />
      {/* <AdjustLeveragePosition position={position} /> */}
    </div>
  );
};
export default LeverageDashboard;
