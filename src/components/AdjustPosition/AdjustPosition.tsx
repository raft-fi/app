import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Decimal } from 'tempus-decimal';
import { v4 as uuid } from 'uuid';
import { CollateralToken, R_TOKEN } from '@raft-fi/sdk';
import { useBorrow, useTokenBalances, useTokenPrices } from '../../hooks';
import { getTokenValues, isCollateralToken } from '../../utils';
import { COLLATERAL_BASE_TOKEN, DISPLAY_BASE_TOKEN } from '../../constants';
import { Nullable } from '../../interfaces';
import { Button, CurrencyInput, Icon, Loading, Typography, ValuesBox } from '../shared';

import './AdjustPosition.scss';

interface AdjustPositionProps {
  collateralBalance: Decimal;
  debtBalance: Decimal;
}

const AdjustPosition: FC<AdjustPositionProps> = ({ collateralBalance, debtBalance }) => {
  const { borrow, borrowStatus } = useBorrow();
  const tokenBalanceMap = useTokenBalances();
  const tokenPriceMap = useTokenPrices();

  const [selectedCollateralToken, setSelectedCollateralToken] = useState<CollateralToken>('wstETH');
  const [collateralAmount, setCollateralAmount] = useState<string>(collateralBalance.toString());
  const [borrowAmount, setBorrowAmount] = useState<string>(debtBalance.toString());
  const [closePositionActive, setClosePositionActive] = useState<boolean>(false);
  const [transactionState, setTransactionState] = useState<string>('default');

  useEffect(() => {
    setCollateralAmount(collateralBalance.toString());
    setBorrowAmount(debtBalance.toString());
  }, [collateralBalance, debtBalance]);

  const handleCollateralTokenChange = useCallback((token: string) => {
    if (isCollateralToken(token)) {
      setSelectedCollateralToken(token);
    }
  }, []);

  const onToggleClosePosition = useCallback(() => {
    if (!closePositionActive) {
      setCollateralAmount('0');
      setBorrowAmount('0');
    } else if (collateralBalance && debtBalance) {
      setCollateralAmount(collateralBalance.toString());
      setBorrowAmount(debtBalance.toString());
    }

    setClosePositionActive(prevState => !prevState);
  }, [closePositionActive, collateralBalance, debtBalance]);

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
    if (!collateralBalance || !debtBalance) {
      return null;
    }

    borrow({
      collateralAmount: new Decimal(collateralAmount),
      debtAmount: new Decimal(borrowAmount),
      collateralToken: selectedCollateralToken,
      currentUserCollateral: collateralBalance,
      currentUserDebt: debtBalance,
      txnId: uuid(),
    });
  }, [borrow, borrowAmount, collateralAmount, collateralBalance, debtBalance, selectedCollateralToken]);

  /**
   * Update action button state based on current borrow request status
   */
  useEffect(() => {
    if (!borrowStatus) {
      return;
    }

    if (borrowStatus.pending) {
      setTransactionState('loading');
    } else if (borrowStatus.success) {
      // TODO - Open success modal with tx info
      setTransactionState('success');
    } else {
      setTransactionState('default');
    }
  }, [borrowStatus]);

  const actionDisabled = useMemo(() => {
    const transactionInProgress = transactionState === 'loading';
    const unchangedPositionAmounts =
      collateralAmount === collateralBalance.toString() && borrowAmount === debtBalance.toString();

    return transactionInProgress || unchangedPositionAmounts;
  }, [borrowAmount, collateralAmount, collateralBalance, debtBalance, transactionState]);

  const collateralTokenBalanceValues = useMemo(
    () =>
      getTokenValues(
        tokenBalanceMap[selectedCollateralToken],
        tokenPriceMap[selectedCollateralToken],
        selectedCollateralToken,
      ),
    [selectedCollateralToken, tokenBalanceMap, tokenPriceMap],
  );

  const debtTokenBalanceValues = useMemo(
    () => getTokenValues(tokenBalanceMap[R_TOKEN], tokenPriceMap[R_TOKEN], R_TOKEN),
    [tokenBalanceMap, tokenPriceMap],
  );

  const collateralTokenInputValues = useMemo(
    () => getTokenValues(collateralAmount, tokenPriceMap[selectedCollateralToken], selectedCollateralToken),
    [collateralAmount, selectedCollateralToken, tokenPriceMap],
  );

  const borrowTokenInputValues = useMemo(
    () => getTokenValues(borrowAmount, tokenPriceMap[R_TOKEN], R_TOKEN),
    [borrowAmount, tokenPriceMap],
  );

  const collateralInputFiatValue = useMemo(() => {
    if (!collateralTokenInputValues.valueFormatted || new Decimal(collateralAmount).isZero()) {
      return '$0.00';
    }

    return `~${collateralTokenInputValues.valueFormatted}`;
  }, [collateralTokenInputValues.valueFormatted, collateralAmount]);

  const borrowInputFiatValue = useMemo(() => {
    if (!borrowTokenInputValues.valueFormatted || new Decimal(borrowAmount).isZero()) {
      return '$0.00';
    }

    return `~${borrowTokenInputValues.valueFormatted}`;
  }, [borrowTokenInputValues.valueFormatted, borrowAmount]);

  /**
   * Current user collateral (wstETH)
   */
  const currentCollateralTokenValues = useMemo(
    () => getTokenValues(collateralBalance, tokenPriceMap[COLLATERAL_BASE_TOKEN], COLLATERAL_BASE_TOKEN),
    [collateralBalance, tokenPriceMap],
  );

  /**
   * Display token (stETH) values
   */
  const displayTokenTokenValues = useMemo(
    () => getTokenValues(Decimal.ONE, tokenPriceMap[DISPLAY_BASE_TOKEN], DISPLAY_BASE_TOKEN),
    [tokenPriceMap],
  );

  /**
   * Current user collateral denominated in display token (stETH)
   */
  const currentCollateralInDisplayToken = useMemo(() => {
    if (!currentCollateralTokenValues.value || !displayTokenTokenValues.price) {
      return null;
    }

    const value = currentCollateralTokenValues.value.div(displayTokenTokenValues.price);

    return getTokenValues(value, displayTokenTokenValues.price, DISPLAY_BASE_TOKEN);
  }, [displayTokenTokenValues.price, currentCollateralTokenValues.value]);

  /**
   * New user collateral denominated in display token (stETH)
   */
  const newCollateralInDisplayToken = useMemo(() => {
    if (
      !collateralTokenInputValues.value ||
      !displayTokenTokenValues.price ||
      !currentCollateralInDisplayToken?.amount
    ) {
      return null;
    }

    let newValue: Nullable<Decimal> = null;
    switch (selectedCollateralToken) {
      case 'ETH':
      case 'stETH':
        newValue = collateralTokenInputValues.amount;
        break;
      case 'wstETH':
        newValue = collateralTokenInputValues.value.div(displayTokenTokenValues.price);
    }

    if (!newValue) {
      return null;
    }

    // Do not show new collateral value in case current collateral is same as new collateral (user did not change input values)
    if (newValue.equals(currentCollateralInDisplayToken.amount)) {
      return null;
    }

    return getTokenValues(newValue, tokenPriceMap[DISPLAY_BASE_TOKEN], DISPLAY_BASE_TOKEN);
  }, [
    displayTokenTokenValues.price,
    collateralTokenInputValues.amount,
    collateralTokenInputValues.value,
    currentCollateralInDisplayToken?.amount,
    selectedCollateralToken,
    tokenPriceMap,
  ]);

  return (
    <div className="raft__adjustPosition">
      <div className="raft__adjustPosition__header">
        <Typography variant="subtitle" weight="medium">
          Adjust position
        </Typography>
        <div className="raft__adjustPosition__actions">
          <Button variant="tertiary" onClick={onToggleClosePosition} selected={closePositionActive}>
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
          fiatValue={collateralInputFiatValue}
          selectedToken={selectedCollateralToken}
          tokens={['ETH', 'stETH', 'wstETH']}
          value={collateralAmount}
          maxAmount={collateralTokenBalanceValues?.amountFormatted}
          onTokenUpdate={handleCollateralTokenChange}
          onValueUpdate={setCollateralAmount}
          step={0.1}
          onIncrementAmount={handleCollateralIncrement}
          onDecrementAmount={handleCollateralDecrement}
          disabled={closePositionActive}
        />
        {/* TODO - Replace hardcoded values with contract values */}
        <CurrencyInput
          label="Borrow"
          precision={18}
          fiatValue={borrowInputFiatValue}
          selectedToken="R"
          tokens={['R']}
          value={borrowAmount}
          maxAmount={debtTokenBalanceValues?.amountFormatted}
          onValueUpdate={setBorrowAmount}
          step={100}
          onIncrementAmount={handleBorrowIncrement}
          onDecrementAmount={handleBorrowDecrement}
          disabled={closePositionActive}
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
              value: currentCollateralInDisplayToken?.amountFormatted || 'N/A',
              newValue: newCollateralInDisplayToken?.amountFormatted,
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
        <Button variant="primary" onClick={onAdjust} disabled={actionDisabled}>
          {transactionState === 'loading' && <Loading />}
          <Typography variant="body-primary" weight="bold" color="text-primary-inverted">
            Execute
          </Typography>
        </Button>
      </div>
    </div>
  );
};
export default AdjustPosition;
