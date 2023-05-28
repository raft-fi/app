import LoadingPosition from './LoadingPosition';
import LoadingStat from './LoadingStat';

import './LoadingDashboard.scss';

const LoadingDashboard = () => (
  <div className="raft__loading-dashboard">
    <LoadingStat />
    <LoadingPosition />
  </div>
);

export default LoadingDashboard;
