import { memo } from 'react';

import './Stats.scss';
import ProtocolStats from '../ProtocolStats';

const Stats = () => {
  return (
    <div className="raft__stats">
      <ProtocolStats />
    </div>
  );
};

export default memo(Stats);
