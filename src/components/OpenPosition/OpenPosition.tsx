import { useCallback, useMemo } from 'react';
import { useConnectWallet } from '@web3-onboard/react';
import { useWallet } from '../../hooks';
import { Button, CurrencyInput, ValuesBox, Typography } from '../shared';

import './OpenPosition.scss';

const OpenPosition = () => {
  const [, connect] = useConnectWallet();

  const wallet = useWallet();

  const walletConnected = useMemo(() => {
    return Boolean(wallet);
  }, [wallet]);

  const onConnectWallet = useCallback(() => {
    connect();
  }, [connect]);

  const onBorrow = useCallback(() => {
    // TODO - Implement borrow functionality
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
          selectedToken="stETH"
          tokens={['ETH', 'stETH', 'wstETH']}
          value="0.05"
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
              label: 'Total collateral',
              value: '0.00 stETH',
            },
            {
              label: 'Total debt (Min 3,000 R)',
              value: '0.00 R',
            },
            {
              label: 'Collateral liquidation price',
              value: '$0.00',
            },
            {
              label: 'Collateralization ratio (Min. 110%)',
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
