import LoadingPosition from './LoadingPosition';
import LoadingStat from './LoadingStat';
import LoadingStatMobile from './LoadingStatMobile';

import './LoadingDashboard.scss';

const LoadingDashboard = () => (
  <div className="raft__loading-dashboard">
    <LoadingStatMobile />
    <LoadingStat />
    <LoadingPosition />
  </div>
);

export default LoadingDashboard;
