import OpenLeveragePosition from '../OpenLeveragePosition';
import YourPositionPlaceholder from '../YourPositionPlaceholder';

import './LeverageDashboard.scss';

const LeverageDashboard = () => {
  return (
    <div className="raft__leverageDashboard">
      <YourPositionPlaceholder />
      <OpenLeveragePosition />
    </div>
  );
};
export default LeverageDashboard;
