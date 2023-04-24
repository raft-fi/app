import { Typography } from 'tempus-ui';
import { ButtonPrimary, CurrencyInput, ValuesBox } from '../shared';

import './OpenPosition.scss';

const OpenPosition = () => {
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
        {/* TODO - If wallet is connected show 'Borrow' button */}
        <ButtonPrimary onClick={() => {}}>
          <Typography variant="body-primary" weight="bold" color="text-primary-inverted">
            Connect wallet
          </Typography>
        </ButtonPrimary>
      </div>
    </div>
  );
};
export default OpenPosition;
