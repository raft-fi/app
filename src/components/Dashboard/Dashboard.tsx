import { memo, useEffect, useMemo, useState } from 'react';
import { useNetwork, useAppLoaded, useWallet, useBorrow, usePosition } from '../../hooks';
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
  const { borrowStatus } = useBorrow();
  const [positionComponentKey, setPositionComponentKey] = useState<string>();

  useEffect(() => {
    if (borrowStatus?.success && borrowStatus?.txnId) {
      setPositionComponentKey(borrowStatus.txnId);
    }
  }, [borrowStatus?.success, borrowStatus?.txnId]);

  const userHasBorrowed = useMemo(() => {
    return position?.collateralBalance?.gt(0) || position?.debtBalance?.gt(0);
  }, [position?.collateralBalance, position?.debtBalance]);

  const shouldShowAdjustPosition = wallet && userHasBorrowed && position && !isWrongNetwork;

  if (!appLoaded) {
    return <LoadingDashbaord />;
  }

  return (
    <div className="raft__dashboard">
      {shouldShowAdjustPosition ? (
        <>
          <YourPosition />
          <AdjustPosition key={`adjust-${positionComponentKey}`} position={position} />
        </>
      ) : (
        <>
          <ProtocolStats />
          <OpenPosition key={`open-${positionComponentKey}`} />
        </>
      )}
    </div>
  );
};

export default memo(Dashboard);
