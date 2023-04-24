import { memo } from 'react';
import ProtocolStats from '../ProtocolStats';
import OpenPosition from '../OpenPosition';

import './Dashboard.scss';

const Dashboard = () => (
  <div className="raft__dashboard">
    <ProtocolStats />
    <OpenPosition />
  </div>
);

export default memo(Dashboard);
