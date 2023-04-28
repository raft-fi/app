import { memo, useMemo } from 'react';
import { useCollateralBalance, useDebtBalance } from '../../hooks';
import ProtocolStats from '../ProtocolStats';
import OpenPosition from '../OpenPosition';
import AdjustPosition from '../AdjustPosition';

import './Dashboard.scss';

const Dashboard = () => {
  const collateralBalance = useCollateralBalance();
  const debtBalance = useDebtBalance();

  const userHasBorrowed = useMemo(() => {
    return collateralBalance?.gt(0) || debtBalance?.gt(0);
  }, [collateralBalance, debtBalance]);

  return (
    <div className="raft__dashboard">
      <ProtocolStats />
      {userHasBorrowed && collateralBalance && debtBalance ? (
        <AdjustPosition collateralBalance={collateralBalance} debtBalance={debtBalance} />
      ) : (
        <OpenPosition />
      )}
    </div>
  );
};

export default memo(Dashboard);
