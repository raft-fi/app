import { memo, useMemo } from 'react';
import { useCollateralBalance, useDebtBalance, useNetwork, useAppLoaded, useWallet } from '../../hooks';
import LoadingDashbaord from '../LoadingDashboard';
import ProtocolStats from '../ProtocolStats';
import YourPosition from '../YourPosition';
import OpenPosition from '../OpenPosition';
import AdjustPosition from '../AdjustPosition';
import TransactionModal from '../TransactionModal';

import './Dashboard.scss';

const Dashboard = () => {
  const appLoaded = useAppLoaded();
  const wallet = useWallet();
  const collateralBalance = useCollateralBalance();
  const debtBalance = useDebtBalance();
  const { isWrongNetwork } = useNetwork();

  const userHasBorrowed = useMemo(() => {
    return collateralBalance?.gt(0) || debtBalance?.gt(0);
  }, [collateralBalance, debtBalance]);

  const shouldShowAdjustPosition = wallet && userHasBorrowed && collateralBalance && debtBalance && !isWrongNetwork;

  if (!appLoaded) {
    return <LoadingDashbaord />;
  }

  return (
    <div className="raft__dashboard">
      {shouldShowAdjustPosition ? (
        <>
          <YourPosition />
          <AdjustPosition collateralBalance={collateralBalance} debtBalance={debtBalance} />
        </>
      ) : (
        <>
          <ProtocolStats />
          <OpenPosition />
        </>
      )}
      <TransactionModal />
    </div>
  );
};

export default memo(Dashboard);
