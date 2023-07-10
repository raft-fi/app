<<<<<<< HEAD
import { memo, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useNetwork, useAppLoaded, useWallet, usePosition } from '../../hooks';
import AdjustLeveragePosition from '../AdjustLeveragePosition';
import LoadingDashboard from '../LoadingDashboard';
import OpenLeveragePosition from '../OpenLeveragePosition';
import YourLeveragePosition from '../YourLeveragePosition';
import YourPositionPlaceholder from '../YourPositionPlaceholder';

import './LeverageDashboard.scss';

const LeverageDashboard = () => {
  const appLoaded = useAppLoaded();
  const wallet = useWallet();
  const position = usePosition();
  const { isWrongNetwork } = useNetwork();

  const userHasPosition = useMemo(() => {
    return (
      (position?.collateralBalance?.gt(0) || position?.debtBalance?.gt(0)) &&
      Boolean(position?.underlyingCollateralToken)
    );
  }, [position?.collateralBalance, position?.debtBalance, position?.underlyingCollateralToken]);

  const shouldShowAdjustPosition = wallet && userHasPosition && position && !isWrongNetwork;

  if (!appLoaded) {
    return <LoadingDashboard />;
  }

  // for now, we only allow user to have either normal position or leverage position
  if (userHasPosition && !position?.principalCollateralBalance) {
    return <Navigate to="/generate" />;
  }

  return (
    <div className="raft__leverageDashboard">
      {shouldShowAdjustPosition ? (
        <>
          <YourPositionPlaceholder />
          <AdjustLeveragePosition />
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
