import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Decimal, DecimalFormat } from '@tempusfinance/decimal';
import { v4 as uuid } from 'uuid';
import { CollateralToken, R_TOKEN } from '@raft-fi/sdk';
import { useBorrow, useTokenBalances, useTokenPrices } from '../../hooks';
import { getTokenValues, isCollateralToken } from '../../utils';
import {
  COLLATERAL_BASE_TOKEN,
  DISPLAY_BASE_TOKEN,
  HEALTHY_RATIO,
  LIQUIDATION_UPPER_RATIO,
  MIN_BORROW_AMOUNT,
  USD_UI_PRECISION,
} from '../../constants';
import { Nullable } from '../../interfaces';
import {
  Button,
  CurrencyInput,
  Icon,
  Loading,
  Tooltip,
  TooltipWrapper,
  Typography,
  ValueLabel,
  ValuesBox,
} from '../shared';

import './AdjustPosition.scss';

interface AdjustPositionProps {
  collateralBalance: Decimal;
  debtBalance: Decimal;
}

const AdjustPosition: FC<AdjustPositionProps> = ({ collateralBalance, debtBalance }) => {
  const { borrow, borrowStatus } = useBorrow();
  const tokenBalanceMap = useTokenBalances();
  const tokenPriceMap = useTokenPrices();

  const [selectedCollateralToken, setSelectedCollateralToken] = useState<CollateralToken>('stETH');
  const [collateralAmount, setCollateralAmount] = useState<string>('');
  const [borrowAmount, setBorrowAmount] = useState<string>('');
  const [closePositionActive, setClosePositionActive] = useState<boolean>(false);
  const [transactionState, setTransactionState] = useState<string>('default');
  const [newCollateralInDisplayTokenValue, setNewCollateralInDisplayTokenValue] = useState<Nullable<Decimal>>(null);

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
      setTransactionState('success');
    } else {
      setTransactionState('default');
    }
  }, [borrowStatus]);

  const handleCollateralTokenChange = useCallback((token: string) => {
    if (isCollateralToken(token)) {
      setSelectedCollateralToken(token);
    }
  }, []);

  const handleCollateralIncrement = useCallback(
    (incrementAmount: number) =>
      setCollateralAmount(prevAmount => Decimal.parse(prevAmount, 0).add(incrementAmount).toString()),
    [],
  );
  const handleCollateralDecrement = useCallback(
    (decrementAmount: number) =>
      setCollateralAmount(prevAmount => Decimal.parse(prevAmount, 0).sub(decrementAmount).toString()),
    [],
  );
  const handleBorrowIncrement = useCallback(
    (incrementAmount: number) =>
      setBorrowAmount(prevAmount => Decimal.parse(prevAmount, 0).add(incrementAmount).toString()),
    [],
  );
  const handleBorrowDecrement = useCallback(
    (decrementAmount: number) =>
      setBorrowAmount(prevAmount => Decimal.parse(prevAmount, 0).sub(decrementAmount).toString()),
    [],
  );

  const collateralAmountDecimal = useMemo(() => Decimal.parse(collateralAmount, 0), [collateralAmount]);
  const borrowAmountDecimal = useMemo(() => Decimal.parse(borrowAmount, 0), [borrowAmount]);

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

  const collateralInputFiatValueFormatted = useMemo(() => {
    if (!collateralTokenInputAbsoluteValues.valueFormatted || collateralAmountDecimal.isZero()) {
      return '$0.00';
    }

    return `~${collateralTokenInputAbsoluteValues.valueFormatted}`;
  }, [collateralTokenInputAbsoluteValues.valueFormatted, collateralAmountDecimal]);
  const borrowInputFiatValueFormatted = useMemo(() => {
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
   * wallet balance for the selected collateral token
   */
  const selectedCollateralTokenBalance = useMemo(
    () => tokenBalanceMap[selectedCollateralToken],
    [selectedCollateralToken, tokenBalanceMap],
  );

  /**
   * Display token (stETH) price
   */
  const displayTokenTokenPrice = useMemo(() => tokenPriceMap[DISPLAY_BASE_TOKEN], [tokenPriceMap]);

  /**
   * Current user collateral denominated in display token (stETH)
   */
  const currentCollateralInDisplayToken = useMemo(() => {
    if (!currentCollateralTokenValues.value || !displayTokenTokenPrice || displayTokenTokenPrice.isZero()) {
      return null;
    }

    const value = currentCollateralTokenValues.value.div(displayTokenTokenPrice);

    return getTokenValues(value, displayTokenTokenPrice, DISPLAY_BASE_TOKEN);
  }, [displayTokenTokenPrice, currentCollateralTokenValues.value]);

  /**
   * New user collateral denominated in display token (stETH)
   */
  useEffect(() => {
    if (
      !collateralTokenInputValues.value ||
      !displayTokenTokenPrice ||
      displayTokenTokenPrice.isZero() ||
      !currentCollateralInDisplayToken?.amount ||
      !currentCollateralTokenValues.value
    ) {
      setNewCollateralInDisplayTokenValue(null);
      return;
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
      setNewCollateralInDisplayTokenValue(null);
      return;
    }

    // Do not show new collateral value in case current collateral is same as new collateral (user did not change input values)
    if (newValue.equals(currentCollateralInDisplayToken.amount)) {
      setNewCollateralInDisplayTokenValue(null);
      return;
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

    setNewCollateralInDisplayTokenValue(newValue);
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

  const newCollateralInDisplayToken = useMemo(
    () => getTokenValues(newCollateralInDisplayTokenValue, tokenPriceMap[DISPLAY_BASE_TOKEN], DISPLAY_BASE_TOKEN),
    [newCollateralInDisplayTokenValue, tokenPriceMap],
  );

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

    if (collateralAmountInDisplayToken.isZero() || debtAmount.isZero()) {
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

    if (collateralAmountInDisplayToken.isZero() || debtAmount.isZero()) {
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

  const minBorrowFormatted = useMemo(() => DecimalFormat.format(MIN_BORROW_AMOUNT, { style: 'decimal' }), []);
  const minRatioFormatted = useMemo(() => DecimalFormat.format(LIQUIDATION_UPPER_RATIO, { style: 'percentage' }), []);

  const isCurrentCollateralHealthy = useMemo(
    () => currentCollateralizationRatio?.gte(HEALTHY_RATIO),
    [currentCollateralizationRatio],
  );
  const isNewCollateralHealthy = useMemo(
    () => newCollateralizationRatio?.gte(HEALTHY_RATIO),
    [newCollateralizationRatio],
  );
  const isClosePosition = useMemo(
    () => newDebtTokenValues?.amount?.isZero() && newCollateralInDisplayToken?.value?.isZero(),
    [newCollateralInDisplayToken?.value, newDebtTokenValues?.amount],
  );
  const hasEnoughCollateralTokenBalance = useMemo(
    () =>
      !newCollateralInDisplayToken?.amount ||
      (selectedCollateralTokenBalance && newCollateralInDisplayToken.amount.lte(selectedCollateralTokenBalance)),
    [newCollateralInDisplayToken?.amount, selectedCollateralTokenBalance],
  );
  const hasMinBorrow = useMemo(
    () => !newDebtTokenValues?.amount || newDebtTokenValues.amount.gte(MIN_BORROW_AMOUNT) || isClosePosition,
    [isClosePosition, newDebtTokenValues?.amount],
  );
  const hasMinRatio = useMemo(
    () => !newCollateralizationRatio || newCollateralizationRatio.gte(LIQUIDATION_UPPER_RATIO) || isClosePosition,
    [isClosePosition, newCollateralizationRatio],
  );
  const isInputNonEmpty = useMemo(
    () => !(collateralAmountDecimal.isZero() && borrowAmountDecimal.isZero()),
    [borrowAmountDecimal, collateralAmountDecimal],
  );

  const canAdjust = useMemo(
    () => isInputNonEmpty && hasEnoughCollateralTokenBalance && hasMinBorrow && hasMinRatio,
    [hasEnoughCollateralTokenBalance, isInputNonEmpty, hasMinBorrow, hasMinRatio],
  );

  const buttonLabel = useMemo(() => {
    if (!hasEnoughCollateralTokenBalance) {
      return 'Insufficient funds';
    }

    if (!hasMinBorrow) {
      return 'Borrow below the minimum amount';
    }

    if (!hasMinRatio) {
      return 'Collateralization ratio below the minimum threshold';
    }

    return 'Execute';
  }, [hasEnoughCollateralTokenBalance, hasMinBorrow, hasMinRatio]);

  const buttonDisabled = useMemo(() => transactionState === 'loading' || !canAdjust, [canAdjust, transactionState]);

  const onToggleClosePosition = useCallback(() => {
    if (!closePositionActive) {
      if (selectedCollateralToken === COLLATERAL_BASE_TOKEN) {
        setCollateralAmount(collateralBalance.mul(-1).toString());
      } else {
        const selectedCollateralTokenPrice = tokenPriceMap[selectedCollateralToken];

        if (
          currentCollateralTokenValues.value &&
          selectedCollateralTokenPrice &&
          !selectedCollateralTokenPrice.isZero()
        ) {
          const collateralBalanceInSelectedCollateralToken =
            currentCollateralTokenValues.value.div(selectedCollateralTokenPrice);
          setCollateralAmount(collateralBalanceInSelectedCollateralToken.mul(-1).toString());
        }
      }

      setBorrowAmount(debtBalance.mul(-1).toString());
    } else if (collateralBalance && debtBalance) {
      setCollateralAmount('0');
      setBorrowAmount('0');
    }

    setClosePositionActive(prevState => !prevState);
  }, [
    closePositionActive,
    collateralBalance,
    currentCollateralTokenValues.value,
    debtBalance,
    selectedCollateralToken,
    tokenPriceMap,
  ]);

  const onAdjust = useCallback(() => {
    if (!canAdjust) {
      return null;
    }

    borrow({
      collateralChange: collateralAmountDecimal,
      debtChange: borrowAmountDecimal,
      collateralToken: selectedCollateralToken,
      currentUserCollateral: collateralBalance,
      currentUserDebt: debtBalance,
      closePosition: closePositionActive,
      txnId: uuid(),
    });
  }, [
    borrow,
    borrowAmountDecimal,
    canAdjust,
    collateralAmountDecimal,
    collateralBalance,
    debtBalance,
    selectedCollateralToken,
    closePositionActive,
  ]);

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
        </div>
      </div>
      <div className="raft__adjustPosition__input">
        <CurrencyInput
          label="Collateral"
          precision={18}
          fiatValue={collateralInputFiatValueFormatted}
          selectedToken={selectedCollateralToken}
          tokens={['stETH', 'wstETH']}
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
        <CurrencyInput
          label="Borrow"
          precision={18}
          fiatValue={borrowInputFiatValueFormatted}
          selectedToken={R_TOKEN}
          tokens={[R_TOKEN]}
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
                  <Typography variant="body-tertiary">{`(Min. ${minBorrowFormatted}`}&nbsp;</Typography>
                  <Typography variant="body-tertiary" type="mono">
                    R
                  </Typography>
                  <Typography variant="body-tertiary">{')'}</Typography>
                </>
              ),
              value: currentDebtTokenValues.amountFormatted || 'N/A',
              newValue:
                newDebtTokenValues?.amountFormatted &&
                (hasMinBorrow ? (
                  `${newDebtTokenValues.amountFormatted || 'N/A'}`
                ) : (
                  <TooltipWrapper
                    anchorClasses="raft__adjustPosition__error"
                    tooltipContent={
                      <Tooltip>
                        <Typography variant="body-tertiary" color="text-error">
                          Borrow below the minimum amount
                        </Typography>
                      </Tooltip>
                    }
                    placement="right"
                  >
                    <ValueLabel value={`${newDebtTokenValues.amountFormatted ?? 0}`} />
                    <Icon variant="error" size="small" />
                  </TooltipWrapper>
                )),
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
                  <Typography variant="body-tertiary">{`(Min. ${minRatioFormatted})`}</Typography>
                </>
              ),
              value: (
                <Typography
                  className="raft__valueLabel"
                  variant="body-primary"
                  color={isCurrentCollateralHealthy ? 'text-success' : undefined}
                  weight="medium"
                >
                  {collateralizationRatioFormatted}
                </Typography>
              ),
              newValue: hasMinRatio ? (
                newCollateralizationRatioFormatted && (
                  <Typography
                    className="raft__valueLabel"
                    variant="body-primary"
                    color={isNewCollateralHealthy ? 'text-success' : undefined}
                    weight="medium"
                  >
                    {newCollateralizationRatioFormatted}
                  </Typography>
                )
              ) : (
                <TooltipWrapper
                  anchorClasses="raft__adjustPosition__error"
                  tooltipContent={
                    <Tooltip>
                      <Typography variant="body-tertiary" color="text-error">
                        Collateralization ratio below the minimum threshold
                      </Typography>
                    </Tooltip>
                  }
                  placement="right"
                >
                  <ValueLabel value={newCollateralizationRatioFormatted as string} />
                  <Icon variant="error" size="small" />
                </TooltipWrapper>
              ),
            },
          ]}
        />
      </div>
      <div className="raft__adjustPosition__action">
        <Button variant="primary" onClick={onAdjust} disabled={buttonDisabled}>
          {transactionState === 'loading' && <Loading />}
          <Typography variant="body-primary" weight="bold" color="text-primary-inverted">
            {buttonLabel}
          </Typography>
        </Button>
      </div>
    </div>
  );
};
export default AdjustPosition;
