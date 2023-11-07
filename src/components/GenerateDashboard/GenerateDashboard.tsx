import { memo, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useNetwork, useAppLoaded, useWallet, usePosition, useVaultVersion, useConfig } from '../../hooks';
import ProtocolStats from '../ProtocolStats';
import YourPosition from '../YourPosition';
import OpenPosition from '../OpenPosition';
import AdjustPosition from '../AdjustPosition';
import { LoadingGenerate } from '../LoadingPage';

import './GenerateDashboard.scss';

const GenerateDashboard = () => {
  const appLoaded = useAppLoaded();
  const wallet = useWallet();
  const position = usePosition();
  const vaultVersion = useVaultVersion();
  const config = useConfig();
  const { isWrongNetwork } = useNetwork();

  const shouldShowAdjustPosition = wallet && position?.hasPosition && !isWrongNetwork;

  /**
   * Collateral token that will be selected by default when user opens the 'Open Position' screen is determined by the vault version.
   */
  const initialCollateralToken = useMemo(() => {
    if (vaultVersion === 'v1') {
      return config.managePositionTokensV1[0];
    }
    return config.managePositionTokensV2[0];
  }, [config.managePositionTokensV1, config.managePositionTokensV2, vaultVersion]);

  if (!appLoaded || true) {
    return <LoadingGenerate />;
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
          <OpenPosition initialCollateralToken={initialCollateralToken} />
        </>
      )}
    </div>
  );
};

export default memo(GenerateDashboard);
