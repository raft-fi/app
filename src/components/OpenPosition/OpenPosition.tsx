import { useCallback, useMemo, useState } from 'react';
import { useConnectWallet } from '@web3-onboard/react';
import { useWallet } from '../../hooks';
import { CollateralToken, isCollateralToken } from '../../interfaces';
import { Button, CurrencyInput, ValuesBox, Typography } from '../shared';

import './OpenPosition.scss';

const OpenPosition = () => {
  const [, connect] = useConnectWallet();

  const wallet = useWallet();

  const [selectedCollateralToken, setSelectedCollateralToken] = useState<CollateralToken>('stETH');

  const walletConnected = useMemo(() => {
    return Boolean(wallet);
  }, [wallet]);

  const onConnectWallet = useCallback(() => {
    connect();
  }, [connect]);

  const onBorrow = useCallback(() => {
    // TODO - Implement borrow functionality
  }, []);

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
          fiatValue="$100.00"
          selectedToken={selectedCollateralToken}
          tokens={['ETH', 'stETH', 'wstETH']}
          value="0.05"
          onTokenUpdate={handleCollateralTokenChange}
        />
        {/* TODO - Replace hardcoded values with contract values */}
        <CurrencyInput
          label="Borrow"
          precision={18}
          fiatValue="$100.00"
          selectedToken="R"
          tokens={['R']}
          value="0.05"
        />
      </div>
      <div className="raft__openPosition__data">
        {/* TODO - Replace hardcoded values with values from contracts */}
        <ValuesBox
          values={[
            {
              id: 'collateral',
              label: 'Total collateral',
              value: '0.00 stETH',
            },
            {
              id: 'debt',
              label: (
                <>
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
              label: 'Collateral liquidation price',
              value: '$0.00',
            },
            {
              id: 'collateralizationRatio',
              label: (
                <>
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
