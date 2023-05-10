import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Decimal, DecimalFormat } from '@tempusfinance/decimal';
import { v4 as uuid } from 'uuid';
import { CollateralToken, R_TOKEN } from '@raft-fi/sdk';
import { useBorrow, useTokenBalances, useTokenPrices } from '../../hooks';
import { getTokenValues, isCollateralToken } from '../../utils';
import { COLLATERAL_BASE_TOKEN, DISPLAY_BASE_TOKEN, LIQUIDATION_UPPER_RATIO, USD_UI_PRECISION } from '../../constants';
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
  const [collateralAmount, setCollateralAmount] = useState<string>('');
  const [borrowAmount, setBorrowAmount] = useState<string>('');
  const [closePositionActive, setClosePositionActive] = useState<boolean>(false);
  const [transactionState, setTransactionState] = useState<string>('default');

  const handleCollateralTokenChange = useCallback((token: string) => {
    if (isCollateralToken(token)) {
      setSelectedCollateralToken(token);
    }
  }, []);

  const onToggleClosePosition = useCallback(() => {
    if (!closePositionActive) {
      setCollateralAmount(collateralBalance.mul(-1).toString());
      setBorrowAmount(debtBalance.mul(-1).toString());
    } else if (collateralBalance && debtBalance) {
      setCollateralAmount('0');
      setBorrowAmount('0');
    }

    setClosePositionActive(prevState => !prevState);
  }, [closePositionActive, collateralBalance, debtBalance]);

  const onMaxSafeBorrow = useCallback(() => {
    // TODO - Implement max safe borrow
  }, []);

  const handleCollateralIncrement = useCallback((incrementAmount: number) => {
    setCollateralAmount(prevAmount => {
      const newAmount = Decimal.parse(prevAmount, 0).add(incrementAmount);
      return newAmount.toString();
    });
  }, []);

  const handleCollateralDecrement = useCallback((decrementAmount: number) => {
    setCollateralAmount(prevAmount => {
      const newAmount = Decimal.parse(prevAmount, 0).sub(decrementAmount);
      return newAmount.toString();
    });
  }, []);

  const handleBorrowIncrement = useCallback((incrementAmount: number) => {
    setBorrowAmount(prevAmount => {
      const newAmount = Decimal.parse(prevAmount, 0).add(incrementAmount);
      return newAmount.toString();
    });
  }, []);

  const handleBorrowDecrement = useCallback((decrementAmount: number) => {
    setBorrowAmount(prevAmount => {
      const newAmount = Decimal.parse(prevAmount, 0).sub(decrementAmount);
      return newAmount.toString();
    });
  }, []);

  const collateralAmountDecimal = useMemo(() => {
    return Decimal.parse(collateralAmount, 0);
  }, [collateralAmount]);

  const borrowAmountDecimal = useMemo(() => {
    return Decimal.parse(borrowAmount, 0);
  }, [borrowAmount]);

  const onAdjust = useCallback(() => {
    if (!collateralBalance || !debtBalance) {
      return null;
    }

    borrow({
      collateralAmount: collateralBalance.add(collateralAmountDecimal),
      debtAmount: debtBalance.add(borrowAmountDecimal),
      collateralToken: selectedCollateralToken,
      currentUserCollateral: collateralBalance,
      currentUserDebt: debtBalance,
      txnId: uuid(),
    });
  }, [borrow, borrowAmountDecimal, collateralAmountDecimal, collateralBalance, debtBalance, selectedCollateralToken]);

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
    const emptyInputs = collateralAmountDecimal.isZero() && borrowAmountDecimal.isZero();

    return transactionInProgress || emptyInputs;
  }, [borrowAmountDecimal, collateralAmountDecimal, transactionState]);

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

  const collateralTokenInputAbsoluteValues = useMemo(
    () =>
      getTokenValues(collateralAmountDecimal.abs(), tokenPriceMap[selectedCollateralToken], selectedCollateralToken),
    [collateralAmountDecimal, selectedCollateralToken, tokenPriceMap],
  );

  const collateralTokenInputValues = useMemo(
    () => getTokenValues(collateralAmountDecimal, tokenPriceMap[selectedCollateralToken], selectedCollateralToken),
    [collateralAmountDecimal, selectedCollateralToken, tokenPriceMap],
  );

  const borrowTokenInputAbsoluteValues = useMemo(
    () => getTokenValues(borrowAmountDecimal.abs(), tokenPriceMap[R_TOKEN], R_TOKEN),
    [borrowAmountDecimal, tokenPriceMap],
  );

  const collateralInputFiatValue = useMemo(() => {
    if (!collateralTokenInputAbsoluteValues.valueFormatted || collateralAmountDecimal.isZero()) {
      return '$0.00';
    }

    return `~${collateralTokenInputAbsoluteValues.valueFormatted}`;
  }, [collateralTokenInputAbsoluteValues.valueFormatted, collateralAmountDecimal]);

  const borrowInputFiatValue = useMemo(() => {
    if (!borrowTokenInputAbsoluteValues.valueFormatted || borrowAmountDecimal.isZero()) {
      return '$0.00';
    }

    return `~${borrowTokenInputAbsoluteValues.valueFormatted}`;
  }, [borrowTokenInputAbsoluteValues.valueFormatted, borrowAmountDecimal]);

  /**
   * Current user collateral (wstETH)
   */
  const currentCollateralTokenValues = useMemo(
    () => getTokenValues(collateralBalance, tokenPriceMap[COLLATERAL_BASE_TOKEN], COLLATERAL_BASE_TOKEN),
    [collateralBalance, tokenPriceMap],
  );

  /**
   * Display token (stETH) price
   */
  const displayTokenTokenPrice = useMemo(() => tokenPriceMap[DISPLAY_BASE_TOKEN], [tokenPriceMap]);

  /**
   * Current user collateral denominated in display token (stETH)
   */
  const currentCollateralInDisplayToken = useMemo(() => {
    if (!currentCollateralTokenValues.value || !displayTokenTokenPrice) {
      return null;
    }

    const value = currentCollateralTokenValues.value.div(displayTokenTokenPrice);

    return getTokenValues(value, displayTokenTokenPrice, DISPLAY_BASE_TOKEN);
  }, [displayTokenTokenPrice, currentCollateralTokenValues.value]);

  /**
   * New user collateral denominated in display token (stETH)
   */
  const newCollateralInDisplayToken = useMemo(() => {
    if (
      !collateralTokenInputValues.value ||
      !displayTokenTokenPrice ||
      !currentCollateralInDisplayToken?.amount ||
      !currentCollateralTokenValues.value
    ) {
      return null;
    }

    let newValue: Nullable<Decimal> = null;
    switch (selectedCollateralToken) {
      case 'ETH':
      case 'stETH':
        newValue = currentCollateralInDisplayToken.amount.add(collateralAmountDecimal);
        break;
      case 'wstETH':
        newValue = currentCollateralTokenValues.value.add(collateralTokenInputValues.value).div(displayTokenTokenPrice);
        break;
    }

    if (!newValue) {
      return null;
    }

    // Do not show new collateral value in case current collateral is same as new collateral (user did not change input values)
    if (newValue.equals(currentCollateralInDisplayToken.amount)) {
      return null;
    }

    // Do not allow user to have negative new balance
    if (newValue.lt(0)) {
      newValue = Decimal.ZERO;

      let newInputValue: Nullable<Decimal> = null;
      switch (selectedCollateralToken) {
        case 'ETH':
        case 'stETH':
          newInputValue = currentCollateralInDisplayToken.amount.mul(-1);
          break;
        case 'wstETH':
          newInputValue = collateralBalance.mul(-1);
          break;
      }

      setCollateralAmount(newInputValue.toString());
    }

    return getTokenValues(newValue, tokenPriceMap[DISPLAY_BASE_TOKEN], DISPLAY_BASE_TOKEN);
  }, [
    collateralTokenInputValues.value,
    displayTokenTokenPrice,
    currentCollateralInDisplayToken?.amount,
    currentCollateralTokenValues.value,
    selectedCollateralToken,
    tokenPriceMap,
    collateralBalance,
    collateralAmountDecimal,
  ]);

  /**
   * Current user debt (R-debt)
   */
  const currentDebtTokenValues = useMemo(
    () => getTokenValues(debtBalance, tokenPriceMap[R_TOKEN], R_TOKEN),
    [debtBalance, tokenPriceMap],
  );

  /**
   * New user debt (R-debt)
   */
  const newDebtTokenValues = useMemo(() => {
    let newValue = debtBalance.add(borrowAmountDecimal);

    // Do not show new debt value in case current debt is same as new collateral (user did not change input values)
    if (newValue.equals(debtBalance)) {
      return null;
    }

    // Do not allow user to have negative new balance
    if (newValue.lt(0)) {
      newValue = Decimal.ZERO;

      setBorrowAmount(debtBalance.mul(-1).toString());
    }

    return getTokenValues(newValue, tokenPriceMap[R_TOKEN], R_TOKEN);
  }, [borrowAmountDecimal, debtBalance, tokenPriceMap]);

  /**
   * Current liquidation price
   */
  const currentLiquidationPrice = useMemo(() => {
    if (!currentCollateralInDisplayToken?.amount || !currentDebtTokenValues?.amount) {
      return null;
    }

    if (currentCollateralInDisplayToken.amount.isZero()) {
      return null;
    }

    return currentDebtTokenValues.amount.mul(LIQUIDATION_UPPER_RATIO).div(currentCollateralInDisplayToken.amount);
  }, [currentCollateralInDisplayToken?.amount, currentDebtTokenValues?.amount]);

  /**
   * Formatted current liquidation price
   */
  const currentLiquidationPriceFormatted = useMemo(
    () =>
      currentLiquidationPrice
        ? `${DecimalFormat.format(currentLiquidationPrice, {
            style: 'currency',
            currency: '$',
            fractionDigits: USD_UI_PRECISION,
          })}`
        : 'N/A',
    [currentLiquidationPrice],
  );

  const newLiquidationPrice = useMemo(() => {
    const collateralAmountInDisplayToken =
      newCollateralInDisplayToken?.amount || currentCollateralInDisplayToken?.amount;
    const debtAmount = newDebtTokenValues?.amount || currentDebtTokenValues?.amount;

    if (!collateralAmountInDisplayToken || !debtAmount) {
      return null;
    }

    if (collateralAmountInDisplayToken.equals(0) || debtAmount.equals(0)) {
      return Decimal.ZERO;
    }

    const newValue = debtAmount.mul(LIQUIDATION_UPPER_RATIO).div(collateralAmountInDisplayToken);

    // Do not show new liquidation price if it's same as current liquidation price
    if (currentLiquidationPrice && newValue.equals(currentLiquidationPrice)) {
      return null;
    }

    return newValue;
  }, [
    currentCollateralInDisplayToken?.amount,
    currentDebtTokenValues?.amount,
    currentLiquidationPrice,
    newCollateralInDisplayToken?.amount,
    newDebtTokenValues?.amount,
  ]);

  /**
   * Formatted new liquidation price
   */
  const newLiquidationPriceFormatted = useMemo(() => {
    if (newLiquidationPrice?.equals(0)) {
      return 'N/A';
    }

    return newLiquidationPrice
      ? `${DecimalFormat.format(newLiquidationPrice, {
          style: 'currency',
          currency: '$',
          fractionDigits: USD_UI_PRECISION,
        })}`
      : null;
  }, [newLiquidationPrice]);

  /**
   * Current collateralization ratio
   */
  const currentCollateralizationRatio = useMemo(() => {
    if (!currentCollateralInDisplayToken?.value || !currentDebtTokenValues.value) {
      return null;
    }

    if (currentDebtTokenValues.value.isZero()) {
      return null;
    }

    return currentCollateralInDisplayToken.value.div(currentDebtTokenValues.value);
  }, [currentCollateralInDisplayToken?.value, currentDebtTokenValues.value]);

  /**
   * Current collateralization ratio formatted
   */
  const collateralizationRatioFormatted = useMemo(
    () =>
      currentCollateralizationRatio
        ? DecimalFormat.format(currentCollateralizationRatio, { style: 'percentage', fractionDigits: 2 })
        : 'N/A',
    [currentCollateralizationRatio],
  );

  /**
   * New collateralization ratio
   */
  const newCollateralizationRatio = useMemo(() => {
    const collateralAmountInDisplayToken = newCollateralInDisplayToken?.value || currentCollateralInDisplayToken?.value;
    const debtAmount = newDebtTokenValues?.value || currentDebtTokenValues?.value;

    if (!collateralAmountInDisplayToken || !debtAmount) {
      return null;
    }

    if (collateralAmountInDisplayToken.equals(0) || debtAmount.equals(0)) {
      return Decimal.ZERO;
    }

    const newValue = collateralAmountInDisplayToken.div(debtAmount);

    // Do not show new collateralization ratio if it's same as current collateralization ratio
    if (currentCollateralizationRatio && newValue.equals(currentCollateralizationRatio)) {
      return null;
    }

    return newValue;
  }, [
    currentCollateralInDisplayToken?.value,
    currentDebtTokenValues?.value,
    newCollateralInDisplayToken?.value,
    newDebtTokenValues?.value,
    currentCollateralizationRatio,
  ]);

  /**
   * New collateralization ratio formatted
   */
  const newCollateralizationRatioFormatted = useMemo(() => {
    if (newCollateralizationRatio?.isZero()) {
      return 'N/A';
    }

    return newCollateralizationRatio
      ? DecimalFormat.format(newCollateralizationRatio, { style: 'percentage', fractionDigits: 2 })
      : null;
  }, [newCollateralizationRatio]);

  return (
    <div className="raft__adjustPosition">
      <div className="raft__adjustPosition__header">
        <Typography variant="subtitle" weight="medium">
          Adjust position
        </Typography>
        <div className="raft__adjustPosition__actions">
          <Button variant="secondary" onClick={onToggleClosePosition} selected={closePositionActive}>
            <Typography variant="body-primary" weight="medium">
              Close position
            </Typography>
          </Button>
          <Button variant="secondary" onClick={onMaxSafeBorrow}>
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
          allowNegativeNumbers={true}
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
          allowNegativeNumbers={true}
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
              value: currentDebtTokenValues.amountFormatted || 'N/A',
              newValue: newDebtTokenValues?.amountFormatted,
            },
            {
              id: 'liquidationPrice',
              label: (
                <>
                  <Icon variant="info" size="small" />
                  <Typography variant="body-primary">Collateral liquidation price&nbsp;</Typography>
                </>
              ),
              value: currentLiquidationPriceFormatted,
              newValue: newLiquidationPriceFormatted,
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
              value: collateralizationRatioFormatted,
              newValue: newCollateralizationRatioFormatted,
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
