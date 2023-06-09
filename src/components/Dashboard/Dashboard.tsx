import { memo, useMemo } from 'react';
import { useNetwork, useAppLoaded, useWallet, usePosition } from '../../hooks';
import LoadingDashbaord from '../LoadingDashboard';
import ProtocolStats from '../ProtocolStats';
import YourPosition from '../YourPosition';
import OpenPosition from '../OpenPosition';
import AdjustPosition from '../AdjustPosition';

import './Dashboard.scss';

const Dashboard = () => {
  const appLoaded = useAppLoaded();
  const wallet = useWallet();
  const position = usePosition();
  const { isWrongNetwork } = useNetwork();

  const userHasBorrowed = useMemo(() => {
    return (
      (position?.collateralBalance?.gt(0) || position?.debtBalance?.gt(0)) &&
      Boolean(position?.underlyingCollateralToken)
    );
  }, [position?.collateralBalance, position?.debtBalance, position?.underlyingCollateralToken]);

  const shouldShowAdjustPosition = wallet && userHasBorrowed && position && !isWrongNetwork;

  if (!appLoaded) {
    return <LoadingDashbaord />;
  }

  return (
    <div className="raft__dashboard">
      {shouldShowAdjustPosition ? (
        <>
          <YourPosition position={position} />
          <AdjustPosition position={position} />
        </>
      ) : (
        <>
          <ProtocolStats />
          <OpenPosition />
        </>
      )}
    </div>
  );
};

export default memo(Dashboard);
