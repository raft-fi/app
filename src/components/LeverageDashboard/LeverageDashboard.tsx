import { memo } from 'react';
import { Navigate } from 'react-router-dom';
import { useNetwork, useAppLoaded, useWallet, useLeveragePosition } from '../../hooks';
import AdjustLeveragePosition from '../AdjustLeveragePosition';
import { LoadingGenerate } from '../LoadingPage';
import OpenLeveragePosition from '../OpenLeveragePosition';
import YourLeveragePosition from '../YourLeveragePosition';
import YourPositionPlaceholder from '../YourPositionPlaceholder';

import './LeverageDashboard.scss';

const LeverageDashboard = () => {
  const appLoaded = useAppLoaded();
  const wallet = useWallet();
  const leveragePosition = useLeveragePosition();
  const { isWrongNetwork } = useNetwork();

  const shouldShowAdjustPosition = wallet && leveragePosition?.hasLeveragePosition && !isWrongNetwork;

  if (!appLoaded) {
    return <LoadingGenerate />;
  }

  // for now, we only allow user to have either normal position or leverage position
  if (leveragePosition && leveragePosition.hasPosition && !leveragePosition.hasLeveragePosition) {
    return <Navigate to="/generate" />;
  }

  return (
    <div className="raft__leverageDashboard">
      {shouldShowAdjustPosition ? (
        <>
          <YourLeveragePosition position={leveragePosition} />
          <AdjustLeveragePosition position={leveragePosition} />
        </>
      ) : (
        <>
          <YourPositionPlaceholder />
          <OpenLeveragePosition />
        </>
      )}
    </div>
  );
};
export default memo(LeverageDashboard);
