import { memo, useMemo } from 'react';
import { useCollateralBalance, useDebtBalance, useNetwork } from '../../hooks';
import ProtocolStats from '../ProtocolStats';
import OpenPosition from '../OpenPosition';
import AdjustPosition from '../AdjustPosition';
import TransactionModal from '../TransactionModal';

import './Dashboard.scss';
import { PositionWithAddress, PriceFeed } from '@raft-fi/sdk';
import { useWalletSigner } from '../../hooks/useWalletSigner';
import { getConfigManager } from '../../config';
import { JsonRpcProvider } from 'ethers';
import { Decimal } from '@tempusfinance/decimal';

const Dashboard = () => {
  const collateralBalance = useCollateralBalance();
  const debtBalance = useDebtBalance();
  const walletSigner = useWalletSigner();
  const { isWrongNetwork } = useNetwork();

  if (walletSigner) {
    const config = getConfigManager().getConfig();

    const provider = new JsonRpcProvider(config.rpcUrl);

    const feed = new PriceFeed(provider, walletSigner);

    const positionWithAddress = new PositionWithAddress('0x0b17837dB96070Fc89bAa37cF07Ba20d34265d3f', provider);
    // positionWithAddress.liquidate(walletSigner);

    // feed.setPrice(new Decimal(30000));
  }

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
