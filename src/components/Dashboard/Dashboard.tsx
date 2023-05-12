import { memo, useMemo } from 'react';
import { useCollateralBalance, useDebtBalance, useNetwork } from '../../hooks';
import ProtocolStats from '../ProtocolStats';
import OpenPosition from '../OpenPosition';
import AdjustPosition from '../AdjustPosition';
import TransactionModal from '../TransactionModal';

import './Dashboard.scss';

const Dashboard = () => {
  const collateralBalance = useCollateralBalance();
  const debtBalance = useDebtBalance();
  const { isWrongNetwork } = useNetwork();

  const userHasBorrowed = useMemo(() => {
    return collateralBalance?.gt(0) || debtBalance?.gt(0);
  }, [collateralBalance, debtBalance]);

  return (
    <div className="raft__dashboard">
      <ProtocolStats />
      {userHasBorrowed && collateralBalance && debtBalance && !isWrongNetwork ? (
        <AdjustPosition collateralBalance={collateralBalance} debtBalance={debtBalance} />
      ) : (
        <OpenPosition />
      )}
      <TransactionModal />
    </div>
  );
};

export default memo(Dashboard);
