import { memo, useMemo } from 'react';
import { useCollateralBalance } from '../../hooks';
import ProtocolStats from '../ProtocolStats';
import OpenPosition from '../OpenPosition';
import AdjustPosition from '../AdjustPosition';

import './Dashboard.scss';

const Dashboard = () => {
  const collateralBalance = useCollateralBalance();

  const userHasBorrowed = useMemo(() => {
    return collateralBalance?.gt(0);
  }, [collateralBalance]);

  return (
    <div className="raft__dashboard">
      <ProtocolStats />
      {userHasBorrowed ? <AdjustPosition /> : <OpenPosition />}
    </div>
  );
};

export default memo(Dashboard);
