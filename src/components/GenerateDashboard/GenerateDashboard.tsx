import { memo } from 'react';
import { Navigate } from 'react-router-dom';
import { useNetwork, useAppLoaded, useWallet, usePosition } from '../../hooks';
import LoadingDashboard from '../LoadingDashboard';
import ProtocolStats from '../ProtocolStats';
import YourPosition from '../YourPosition';
import OpenPosition from '../OpenPosition';
import AdjustPosition from '../AdjustPosition';

import './GenerateDashboard.scss';

const GenerateDashboard = () => {
  const appLoaded = useAppLoaded();
  const wallet = useWallet();
  const position = usePosition();
  const { isWrongNetwork } = useNetwork();

  const shouldShowAdjustPosition = wallet && position?.hasPosition && !isWrongNetwork;

  if (!appLoaded) {
    return <LoadingDashboard />;
  }

  // for now, we only allow user to have either normal position or leverage position
  if (position?.hasLeveragePosition) {
    return <Navigate to="/leverage" />;
  }

  return (
    <div className="raft__generateDashboard">
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

export default memo(GenerateDashboard);
