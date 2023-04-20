import { memo } from 'react';
import ProtocolStats from '../ProtocolStats';

import './Dashboard.scss';

const Dashboard = () => (
  <div className="raft__dashboard">
    <ProtocolStats />
  </div>
);

export default memo(Dashboard);
