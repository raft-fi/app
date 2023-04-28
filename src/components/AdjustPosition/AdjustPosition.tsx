import { useCallback, useState } from 'react';
import Decimal from 'decimal';
import { Button, CurrencyInput, Icon, Typography, ValuesBox } from '../shared';
import { CollateralToken, isCollateralToken } from '../../interfaces';

import './AdjustPosition.scss';

const AdjustPosition = () => {
  const [selectedCollateralToken, setSelectedCollateralToken] = useState<CollateralToken>('wstETH');
  const [collateralAmount, setCollateralAmount] = useState<string>('');
  const [borrowAmount, setBorrowAmount] = useState<string>('');

  const handleCollateralTokenChange = useCallback((token: string) => {
    if (isCollateralToken(token)) {
      setSelectedCollateralToken(token);
    }
  }, []);

  const onClosePosition = useCallback(() => {
    // TODO - Implement close position
  }, []);

  const onMaxSafeBorrow = useCallback(() => {
    // TODO - Implement max safe borrow
  }, []);

  const handleCollateralIncrement = useCallback((incrementAmount: number) => {
    setCollateralAmount(prevAmount => {
      const newAmount = new Decimal(prevAmount || '0').add(incrementAmount);
      return newAmount.toString();
    });
  }, []);

  const handleCollateralDecrement = useCallback((decrementAmount: number) => {
    setCollateralAmount(prevAmount => {
      const newAmount = new Decimal(prevAmount || '0').sub(decrementAmount);

      if (newAmount.lt(0)) {
        return '0';
      }
      return newAmount.toString();
    });
  }, []);

  const handleBorrowIncrement = useCallback((incrementAmount: number) => {
    setBorrowAmount(prevAmount => {
      const newAmount = new Decimal(prevAmount || '0').add(incrementAmount);
      return newAmount.toString();
    });
  }, []);

  const handleBorrowDecrement = useCallback((decrementAmount: number) => {
    setBorrowAmount(prevAmount => {
      const newAmount = new Decimal(prevAmount || '0').sub(decrementAmount);

      if (newAmount.lt(0)) {
        return '0';
      }
      return newAmount.toString();
    });
  }, []);

  const onAdjust = useCallback(() => {
    // TODO - Implement adjust position action
  }, []);

  return (
    <div className="raft__adjustPosition">
      <div className="raft__adjustPosition__header">
        <Typography variant="subtitle" weight="medium">
          Adjust position
        </Typography>
        <div className="raft__adjustPosition__actions">
          <Button variant="tertiary" onClick={onClosePosition}>
            <Typography variant="body-primary" weight="medium">
              Close position
            </Typography>
          </Button>
          <Button variant="tertiary" onClick={onMaxSafeBorrow}>
            <Typography variant="body-primary" weight="medium">
              Max safe borrow
            </Typography>
          </Button>
        </div>
      </div>
      <div className="raft__adjustPosition__input">
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
          step={0.1}
          onIncrementAmount={handleCollateralIncrement}
          onDecrementAmount={handleCollateralDecrement}
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
          step={100}
          onIncrementAmount={handleBorrowIncrement}
          onDecrementAmount={handleBorrowDecrement}
        />
      </div>
      <div className="raft__adjustPosition__data">
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
      <div className="raft__adjustPosition__action">
        <Button variant="primary" onClick={onAdjust}>
          <Typography variant="body-primary" weight="bold" color="text-primary-inverted">
            Execute
          </Typography>
        </Button>
      </div>
    </div>
  );
};
export default AdjustPosition;
