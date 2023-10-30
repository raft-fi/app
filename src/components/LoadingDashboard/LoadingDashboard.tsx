import LoadingPosition from './LoadingPosition';
import LoadingStat from './LoadingStat';
import LoadingStatMobile from './LoadingStatMobile';
import LoadingPositionMobile from './LoadingPositionMobile';

import './LoadingDashboard.scss';

const LoadingDashboard = () => (
  <div className="raft__loading-dashboard">
    <LoadingStatMobile />
    <LoadingStat />
    <LoadingPositionMobile />
    <LoadingPosition />
  </div>
);

export default LoadingDashboard;
