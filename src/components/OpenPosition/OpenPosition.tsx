import { useCallback, useMemo, useState } from 'react';
import Decimal from 'decimal';
import { v4 as uuid } from 'uuid';
import { useConnectWallet } from '@web3-onboard/react';
import { useWallet, useBorrow } from '../../hooks';
import { CollateralToken, isCollateralToken } from '../../interfaces';
import { Button, CurrencyInput, ValuesBox, Typography, Icon } from '../shared';

import './OpenPosition.scss';

const OpenPosition = () => {
  const [, connect] = useConnectWallet();

  const wallet = useWallet();
  const { borrow } = useBorrow();

  const [selectedCollateralToken, setSelectedCollateralToken] = useState<CollateralToken>('wstETH');
  const [collateralAmount, setCollateralAmount] = useState<string>('');
  const [borrowAmount, setBorrowAmount] = useState<string>('');

  const walletConnected = useMemo(() => {
    return Boolean(wallet);
  }, [wallet]);

  const onConnectWallet = useCallback(() => {
    connect();
  }, [connect]);

  const onBorrow = useCallback(() => {
    borrow({
      collateralAmount: new Decimal(collateralAmount),
      debtAmount: new Decimal(borrowAmount),
      collateralToken: selectedCollateralToken,
      currentUserCollateral: new Decimal(0), // TODO - Fetch current user collateral
      currentUserDebt: new Decimal(0), // TODO - Fetch current user debt
      txnId: uuid(),
    });
  }, [borrow, borrowAmount, collateralAmount, selectedCollateralToken]);

  const handleCollateralTokenChange = useCallback((token: string) => {
    if (isCollateralToken(token)) {
      setSelectedCollateralToken(token);
    }
  }, []);

  return (
    <div className="raft__openPosition">
      <div className="raft__openPosition__header">
        <Typography variant="subtitle" weight="medium">
          Open position
        </Typography>
      </div>
      <div className="raft__openPosition__input">
        {/* TODO - Replace hardcoded values with contract values */}
        <CurrencyInput
          label="Collateral"
          precision={18}
          fiatValue="~$100.00"
          selectedToken={selectedCollateralToken}
          tokens={['ETH', 'stETH', 'wstETH']}
          value={collateralAmount}
          onTokenUpdate={handleCollateralTokenChange}
          onValueUpdate={setCollateralAmount}
        />
        {/* TODO - Replace hardcoded values with contract values */}
        <CurrencyInput
          label="Borrow"
          precision={18}
          fiatValue="~$100.00"
          selectedToken="R"
          tokens={['R']}
          value={borrowAmount}
          onValueUpdate={setBorrowAmount}
        />
      </div>
      <div className="raft__openPosition__data">
        {/* TODO - Replace hardcoded values with values from contracts */}
        <ValuesBox
          values={[
            {
              id: 'collateral',
              label: (
                <>
                  <Icon variant="info" size="small" />
                  <Typography variant="body-primary">Total collateral&nbsp;</Typography>
                </>
              ),
              value: '0.00 stETH',
            },
            {
              id: 'debt',
              label: (
                <>
                  <Icon variant="info" size="small" />
                  <Typography variant="body-primary">Total debt&nbsp;</Typography>
                  <Typography variant="body-tertiary">{'(Min. 3,000'}&nbsp;</Typography>
                  <Typography variant="body-tertiary" type="mono">
                    R
                  </Typography>
                  <Typography variant="body-tertiary">{')'}</Typography>
                </>
              ),
              value: '0.00 R',
            },
            {
              id: 'liquidationPrice',
              label: (
                <>
                  <Icon variant="info" size="small" />
                  <Typography variant="body-primary">Collateral liquidation price&nbsp;</Typography>
                </>
              ),
              value: '$0.00',
            },
            {
              id: 'collateralizationRatio',
              label: (
                <>
                  <Icon variant="info" size="small" />
                  <Typography variant="body-primary">Collateralization ratio&nbsp;</Typography>
                  <Typography variant="body-tertiary">{'(Min. 110%)'}</Typography>
                </>
              ),
              value: 'N/A',
            },
          ]}
        />
      </div>
      <div className="raft__openPosition__action">
        <Button variant="primary" onClick={walletConnected ? onBorrow : onConnectWallet}>
          <Typography variant="body-primary" weight="bold" color="text-primary-inverted">
            {walletConnected ? 'Borrow' : 'Connect wallet'}
          </Typography>
        </Button>
      </div>
    </div>
  );
};
export default OpenPosition;
