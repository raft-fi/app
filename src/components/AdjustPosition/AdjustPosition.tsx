import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Decimal, DecimalFormat } from '@tempusfinance/decimal';
import { v4 as uuid } from 'uuid';
import { CollateralToken, R_TOKEN } from '@raft-fi/sdk';
import { useBorrow, useTokenBalances, useTokenPrices } from '../../hooks';
import { getCollateralRatioColor, getTokenValues, isCollateralToken } from '../../utils';
import {
  COLLATERAL_BASE_TOKEN,
  DISPLAY_BASE_TOKEN,
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

const INPUT_PREVIEW_DIGITS = 4;

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
      setCollateralAmount('');
      setBorrowAmount('');
    } else {
      setTransactionState('default');
    }
  }, [borrowStatus]);

  const handleCollateralTokenChange = useCallback((token: string) => {
    if (isCollateralToken(token)) {
      setSelectedCollateralToken(token);
    }
  }, []);

  // when user input is +ve number, we prepend a "+"
  const prependPositiveSign = useCallback((amount: string) => {
    if (amount.startsWith('+')) {
      // already have a "+"
      return amount;
    } else {
      const decimal = Decimal.parse(amount, 0);

      if (decimal.gt(0)) {
        // if +ve, prepend a "+"
        return `+${amount}`;
      } else {
        return amount;
      }
    }
  }, []);

  const handleCollateralAmountChange = useCallback(
    (amount: string) => setCollateralAmount(prependPositiveSign(amount)),
    [prependPositiveSign],
  );
  const handleBorrowAmountChange = useCallback(
    (amount: string) => setBorrowAmount(prependPositiveSign(amount)),
    [prependPositiveSign],
  );
  const handleCollateralIncrement = useCallback(
    (incrementAmount: number) =>
      setCollateralAmount(prevAmount =>
        prependPositiveSign(Decimal.parse(prevAmount, 0).add(incrementAmount).toString()),
      ),
    [prependPositiveSign],
  );
  const handleCollateralDecrement = useCallback(
    (decrementAmount: number) =>
      setCollateralAmount(prevAmount =>
        prependPositiveSign(Decimal.parse(prevAmount, 0).sub(decrementAmount).toString()),
      ),
    [prependPositiveSign],
  );
  const handleBorrowIncrement = useCallback(
    (incrementAmount: number) =>
      setBorrowAmount(prevAmount => prependPositiveSign(Decimal.parse(prevAmount, 0).add(incrementAmount).toString())),
    [prependPositiveSign],
  );
  const handleBorrowDecrement = useCallback(
    (decrementAmount: number) =>
      setBorrowAmount(prevAmount => prependPositiveSign(Decimal.parse(prevAmount, 0).sub(decrementAmount).toString())),
    [prependPositiveSign],
  );
  const handleCollateralAmountBlur = useCallback(() => {
    const decimal = Decimal.parse(collateralAmount, 0);
    if (decimal.isZero()) {
      setCollateralAmount('0');
    }
  }, [collateralAmount]);
  const handleBorrowAmountBlur = useCallback(() => {
    const decimal = Decimal.parse(borrowAmount, 0);
    if (decimal.isZero()) {
      setBorrowAmount('0');
    }
  }, [borrowAmount]);

  const collateralAmountDecimal = useMemo(() => Decimal.parse(collateralAmount, 0), [collateralAmount]);
  const borrowAmountDecimal = useMemo(() => Decimal.parse(borrowAmount, 0), [borrowAmount]);
  const collateralAmountWithEllipse = useMemo(() => {
    const original = collateralAmountDecimal.toString();
    const truncated = collateralAmountDecimal.toTruncated(INPUT_PREVIEW_DIGITS);
    const positiveSign = collateralAmountDecimal.gt(0) ? '+' : '';

    return original === truncated ? `${positiveSign}${original}` : `${positiveSign}${truncated}...`;
  }, [collateralAmountDecimal]);
  const borrowAmountWithEllipse = useMemo(() => {
    const original = borrowAmountDecimal.toString();
    const truncated = borrowAmountDecimal.toTruncated(INPUT_PREVIEW_DIGITS);
    const positiveSign = borrowAmountDecimal.gt(0) ? '+' : '';

    return original === truncated ? `${positiveSign}${original}` : `${positiveSign}${truncated}...`;
  }, [borrowAmountDecimal]);

  const debtTokenBalanceValues = useMemo(
    () => getTokenValues(tokenBalanceMap[R_TOKEN], tokenPriceMap[R_TOKEN], R_TOKEN),
    [tokenBalanceMap, tokenPriceMap],
  );
  const collateralTokenInputValues = useMemo(
    () => getTokenValues(collateralAmountDecimal, tokenPriceMap[selectedCollateralToken], selectedCollateralToken),
    [collateralAmountDecimal, selectedCollateralToken, tokenPriceMap],
  );

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

      handleCollateralAmountChange(newInputValue.toString());
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
    prependPositiveSign,
    handleCollateralAmountChange,
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

      handleBorrowAmountChange(debtBalance.mul(-1).toString());
    }

    return getTokenValues(newValue, tokenPriceMap[R_TOKEN], R_TOKEN);
  }, [borrowAmountDecimal, debtBalance, handleBorrowAmountChange, tokenPriceMap]);

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
    if (newLiquidationPrice?.isZero()) {
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

    if (!collateralAmountInDisplayToken || !debtAmount || debtAmount.isZero()) {
      return null;
    }

    if (collateralAmountInDisplayToken.isZero()) {
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
    if (!newCollateralizationRatio) {
      return 'N/A';
    }

    return DecimalFormat.format(newCollateralizationRatio, { style: 'percentage', fractionDigits: 2 });
  }, [newCollateralizationRatio]);

  const minBorrowFormatted = useMemo(() => DecimalFormat.format(MIN_BORROW_AMOUNT, { style: 'decimal' }), []);
  const minRatioFormatted = useMemo(() => DecimalFormat.format(LIQUIDATION_UPPER_RATIO, { style: 'percentage' }), []);

  const currentCollateralRatioColor = useMemo(
    () => getCollateralRatioColor(currentCollateralizationRatio),
    [currentCollateralizationRatio],
  );
  const newCollateralRatioColor = useMemo(
    () => getCollateralRatioColor(newCollateralizationRatio),
    [newCollateralizationRatio],
  );
  const isClosePosition = useMemo(
    () => newDebtTokenValues?.amount?.isZero() && newCollateralInDisplayToken?.value?.isZero(),
    [newCollateralInDisplayToken?.value, newDebtTokenValues?.amount],
  );
  const hasEnoughCollateralTokenBalance = useMemo(
    () => selectedCollateralTokenBalance?.gte(collateralAmountDecimal),
    [collateralAmountDecimal, selectedCollateralTokenBalance],
  );
  const hasEnoughDebtTokenBalance = useMemo(
    () =>
      !debtTokenBalanceValues.amount ||
      (debtTokenBalanceValues.amount.gt(borrowAmountDecimal.abs()) && borrowAmountDecimal.lt(0)) ||
      borrowAmountDecimal.gte(0),
    [borrowAmountDecimal, debtTokenBalanceValues.amount],
  );
  const hasMinBorrow = useMemo(
    () => !newDebtTokenValues?.amount || newDebtTokenValues.amount.gte(MIN_BORROW_AMOUNT) || isClosePosition,
    [isClosePosition, newDebtTokenValues?.amount],
  );
  const hasMinCurrentRatio = useMemo(
    () => !currentCollateralizationRatio || currentCollateralizationRatio.gte(LIQUIDATION_UPPER_RATIO),
    [currentCollateralizationRatio],
  );
  const hasMinNewRatio = useMemo(
    () => !newCollateralizationRatio || newCollateralizationRatio.gte(LIQUIDATION_UPPER_RATIO) || isClosePosition,
    [isClosePosition, newCollateralizationRatio],
  );
  const isInputNonEmpty = useMemo(
    () => !(collateralAmountDecimal.isZero() && borrowAmountDecimal.isZero()),
    [borrowAmountDecimal, collateralAmountDecimal],
  );
  const hasCollateralChange = useMemo(
    () =>
      isClosePosition ||
      (currentCollateralizationRatio &&
        newCollateralizationRatio &&
        !currentCollateralizationRatio.equals(newCollateralizationRatio)),
    [currentCollateralizationRatio, isClosePosition, newCollateralizationRatio],
  );

  const canAdjust = useMemo(
    () =>
      isInputNonEmpty && hasEnoughCollateralTokenBalance && hasEnoughDebtTokenBalance && hasMinBorrow && hasMinNewRatio,
    [isInputNonEmpty, hasEnoughCollateralTokenBalance, hasEnoughDebtTokenBalance, hasMinBorrow, hasMinNewRatio],
  );

  const buttonLabel = useMemo(() => {
    if (!hasEnoughCollateralTokenBalance) {
      return 'Insufficient funds';
    }

    if (!hasEnoughDebtTokenBalance) {
      return 'Insufficient R to repay';
    }
    if (!hasMinBorrow) {
      return 'Borrow below the minimum amount';
    }

    if (!hasMinNewRatio) {
      return 'Collateralization ratio is below the minimum threshold';
    }

    return 'Execute';
  }, [hasEnoughCollateralTokenBalance, hasEnoughDebtTokenBalance, hasMinBorrow, hasMinNewRatio]);

  const buttonDisabled = useMemo(() => transactionState === 'loading' || !canAdjust, [canAdjust, transactionState]);

  const onToggleClosePosition = useCallback(() => {
    if (!closePositionActive) {
      if (selectedCollateralToken === COLLATERAL_BASE_TOKEN) {
        handleCollateralAmountChange(collateralBalance.mul(-1).toString());
      } else {
        const selectedCollateralTokenPrice = tokenPriceMap[selectedCollateralToken];

        if (
          currentCollateralTokenValues.value &&
          selectedCollateralTokenPrice &&
          !selectedCollateralTokenPrice.isZero()
        ) {
          const collateralBalanceInSelectedCollateralToken =
            currentCollateralTokenValues.value.div(selectedCollateralTokenPrice);
          handleCollateralAmountChange(collateralBalanceInSelectedCollateralToken.mul(-1).toString());
        }
      }

      handleBorrowAmountChange(debtBalance.mul(-1).toString());
    } else if (collateralBalance && debtBalance) {
      handleCollateralAmountChange('0');
      handleBorrowAmountChange('0');
    }

    setClosePositionActive(prevState => !prevState);
  }, [
    closePositionActive,
    collateralBalance,
    currentCollateralTokenValues.value,
    debtBalance,
    handleBorrowAmountChange,
    handleCollateralAmountChange,
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
          Adjust Position
        </Typography>
        <div className="raft__adjustPosition__actions">
          <Button variant="secondary" onClick={onToggleClosePosition} selected={closePositionActive}>
            <Typography variant="body-primary" weight="medium">
              Close Position
            </Typography>
          </Button>
        </div>
      </div>
      <div className="raft__adjustPosition__input">
        <CurrencyInput
          label="Adjust collateral"
          precision={18}
          fiatValue={null}
          selectedToken={selectedCollateralToken}
          tokens={['stETH', 'wstETH']}
          value={collateralAmount}
          previewValue={collateralAmountWithEllipse}
          onTokenUpdate={handleCollateralTokenChange}
          onValueUpdate={handleCollateralAmountChange}
          step={0.1}
          onIncrementAmount={handleCollateralIncrement}
          onDecrementAmount={handleCollateralDecrement}
          disabled={closePositionActive}
          decrementDisabled={newCollateralInDisplayToken.amount?.isZero()}
          allowNegativeNumbers={true}
          onBlur={handleCollateralAmountBlur}
          error={!hasEnoughCollateralTokenBalance || !hasMinNewRatio}
        />
        <CurrencyInput
          label="Adjust borrow"
          precision={18}
          fiatValue={null}
          selectedToken={R_TOKEN}
          tokens={[R_TOKEN]}
          value={borrowAmount}
          previewValue={borrowAmountWithEllipse}
          onValueUpdate={handleBorrowAmountChange}
          step={100}
          onIncrementAmount={handleBorrowIncrement}
          onDecrementAmount={handleBorrowDecrement}
          disabled={closePositionActive}
          decrementDisabled={newDebtTokenValues?.amount?.isZero()}
          allowNegativeNumbers={true}
          onBlur={handleBorrowAmountBlur}
          error={!hasMinBorrow || !hasMinNewRatio}
          maxIntegralDigits={10}
        />
      </div>
      <div className="raft__adjustPosition__data">
        <ValuesBox
          values={[
            {
              id: 'collateral',
              label: (
                <>
                  <TooltipWrapper
                    tooltipContent={
                      <Tooltip className="raft__adjustPosition__infoTooltip">
                        <Typography className="raft__adjustPosition__infoTooltipText" variant="body-secondary">
                          The amount of collateral in your Position.
                        </Typography>
                      </Tooltip>
                    }
                    placement="left"
                  >
                    <Icon variant="info" size="small" />
                  </TooltipWrapper>
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
                  <TooltipWrapper
                    tooltipContent={
                      <Tooltip className="raft__adjustPosition__infoTooltip">
                        <Typography className="raft__adjustPosition__infoTooltipText" variant="body-secondary">
                          The amount of debt your Position has.
                        </Typography>
                      </Tooltip>
                    }
                    placement="left"
                  >
                    <Icon variant="info" size="small" />
                  </TooltipWrapper>
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
                    <ValueLabel value={`${newDebtTokenValues.amountFormatted ?? 0}`} color="text-error" />
                    <Icon variant="error" size="small" />
                  </TooltipWrapper>
                )),
            },
            {
              id: 'liquidationPrice',
              label: (
                <>
                  <TooltipWrapper
                    tooltipContent={
                      <Tooltip className="raft__adjustPosition__infoTooltip">
                        <Typography className="raft__adjustPosition__infoTooltipText" variant="body-secondary">
                          The price of one unit of collateral at which your Position will be available to be liquidated.
                          Learn more about liquidations&nbsp;
                          <a href="https://docs.raft.fi/how-it-works/returning/liquidation" target="_blank">
                            here
                            <span>
                              <Icon variant="external-link" size={10} />
                            </span>
                          </a>
                        </Typography>
                      </Tooltip>
                    }
                    placement="left"
                  >
                    <Icon variant="info" size="small" />
                  </TooltipWrapper>
                  <Typography variant="body-primary">Collateral liquidation price&nbsp;</Typography>
                </>
              ),
              value: hasMinCurrentRatio ? currentLiquidationPriceFormatted : 'N/A',
              newValue: hasMinNewRatio ? newLiquidationPriceFormatted : 'N/A',
            },
            {
              id: 'collateralizationRatio',
              label: (
                <>
                  <TooltipWrapper
                    tooltipContent={
                      <Tooltip className="raft__adjustPosition__infoTooltip">
                        <Typography className="raft__adjustPosition__infoTooltipText" variant="body-secondary">
                          The percentage of R borrowed in relation to the total collateral amount.
                        </Typography>
                      </Tooltip>
                    }
                    placement="left"
                  >
                    <Icon variant="info" size="small" />
                  </TooltipWrapper>
                  <Typography variant="body-primary">Collateralization ratio&nbsp;</Typography>
                  <Typography variant="body-tertiary">{`(Min. ${minRatioFormatted})`}</Typography>
                </>
              ),
              value: <ValueLabel color={currentCollateralRatioColor} value={collateralizationRatioFormatted} />,
              newValue: hasMinNewRatio ? (
                hasCollateralChange && (
                  <ValueLabel color={newCollateralRatioColor} value={newCollateralizationRatioFormatted} />
                )
              ) : (
                <TooltipWrapper
                  anchorClasses="raft__adjustPosition__error"
                  tooltipContent={
                    <Tooltip>
                      <Typography variant="body-tertiary" color="text-error">
                        Collateralization ratio is below the minimum threshold
                      </Typography>
                    </Tooltip>
                  }
                  placement="right"
                >
                  <ValueLabel value={newCollateralizationRatioFormatted as string} color="text-error" />
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
