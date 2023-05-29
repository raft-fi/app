import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Decimal, DecimalFormat } from '@tempusfinance/decimal';
import { TokenLogo } from 'tempus-ui';
import { v4 as uuid } from 'uuid';
import { CollateralToken, R_TOKEN, TOKENS_WITH_PERMIT } from '@raft-fi/sdk';
import {
  useApprove,
  useBorrow,
  useTokenAllowances,
  useTokenBalances,
  useTokenPrices,
  useTokenWhitelists,
  useWhitelistDelegate,
} from '../../hooks';
import { getCollateralRatioLabel, getCollateralRatioLevel, getTokenValues, isCollateralToken } from '../../utils';
import {
  COLLATERAL_BASE_TOKEN,
  COLLATERAL_TOKEN_UI_PRECISION,
  DISPLAY_BASE_TOKEN,
  LIQUIDATION_UPPER_RATIO,
  MIN_BORROW_AMOUNT,
  SUPPORTED_COLLATERAL_TOKENS,
} from '../../constants';
import { Nullable } from '../../interfaces';
import { Button, CurrencyInput, Icon, Loading, Typography, ValueLabel } from '../shared';

import './AdjustPosition.scss';

interface AdjustPositionProps {
  collateralBalance: Decimal;
  debtBalance: Decimal;
}

const AdjustPosition: FC<AdjustPositionProps> = ({ collateralBalance, debtBalance }) => {
  const { borrow, borrowStatus } = useBorrow();
  const { approve, approveStatus } = useApprove();
  const { whitelistDelegate, whitelistDelegateStatus } = useWhitelistDelegate();
  const tokenBalanceMap = useTokenBalances();
  const tokenPriceMap = useTokenPrices();
  const tokenAllowanceMap = useTokenAllowances();
  const tokenWhitelistMap = useTokenWhitelists();

  const [selectedCollateralToken, setSelectedCollateralToken] = useState<CollateralToken>('stETH');
  const [collateralAmount, setCollateralAmount] = useState<string>('');
  const [borrowAmount, setBorrowAmount] = useState<string>('');
  const [closePositionActive, setClosePositionActive] = useState<boolean>(false);
  const [transactionState, setTransactionState] = useState<string>('default');

  /**
   * Update action button state based on current borrow request status
   */
  useEffect(() => {
    if (!whitelistDelegateStatus && !approveStatus && !borrowStatus) {
      return;
    }

    if (whitelistDelegateStatus?.pending || approveStatus?.pending || borrowStatus?.pending) {
      setTransactionState('loading');
    } else if (whitelistDelegateStatus?.success || approveStatus?.success || borrowStatus?.success) {
      setTransactionState('success');
    } else {
      setTransactionState('default');
    }
  }, [approveStatus, borrowStatus, whitelistDelegateStatus]);

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
  const selectedCollateralTokenAllowance = useMemo(
    () => tokenAllowanceMap[selectedCollateralToken],
    [selectedCollateralToken, tokenAllowanceMap],
  );
  const selectedCollateralTokenWhitelist = useMemo(
    () => tokenWhitelistMap[selectedCollateralToken],
    [selectedCollateralToken, tokenWhitelistMap],
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
  const newCollateralInDisplayTokenValue = useMemo(() => {
    if (
      !collateralTokenInputValues.value ||
      !displayTokenTokenPrice ||
      displayTokenTokenPrice.isZero() ||
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

    return newValue;
  }, [
    collateralTokenInputValues.value,
    displayTokenTokenPrice,
    currentCollateralInDisplayToken?.amount,
    currentCollateralTokenValues.value,
    selectedCollateralToken,
    collateralAmountDecimal,
  ]);

  const newCollateralInDisplayToken = useMemo(
    () => getTokenValues(newCollateralInDisplayTokenValue, tokenPriceMap[DISPLAY_BASE_TOKEN], DISPLAY_BASE_TOKEN),
    [newCollateralInDisplayTokenValue, tokenPriceMap],
  );

  const newCollateralInDisplayTokenAmountFormatted = useMemo(
    () =>
      DecimalFormat.format(newCollateralInDisplayToken.amount ?? Decimal.ZERO, {
        style: 'currency',
        currency: DISPLAY_BASE_TOKEN,
        fractionDigits: COLLATERAL_TOKEN_UI_PRECISION,
        lessThanFormat: true,
      }),
    [newCollateralInDisplayToken.amount],
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
    const newValue = debtBalance.add(borrowAmountDecimal);

    return getTokenValues(newValue, tokenPriceMap[R_TOKEN], R_TOKEN);
  }, [borrowAmountDecimal, debtBalance, tokenPriceMap]);

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

    return collateralAmountInDisplayToken.div(debtAmount);
  }, [
    currentCollateralInDisplayToken?.value,
    currentDebtTokenValues?.value,
    newCollateralInDisplayToken?.value,
    newDebtTokenValues?.value,
  ]);

  const newCollateralizationRatioFormatted = useMemo(
    () =>
      newCollateralizationRatio
        ? DecimalFormat.format(newCollateralizationRatio, { style: 'percentage', fractionDigits: 2 })
        : 'N/A',
    [newCollateralizationRatio],
  );

  const newCollateralRatioLevel = useMemo(
    () => getCollateralRatioLevel(newCollateralizationRatio),
    [newCollateralizationRatio],
  );
  const newCollateralRatioLabel = useMemo(
    () => getCollateralRatioLabel(newCollateralizationRatio),
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
      (debtTokenBalanceValues.amount.gte(borrowAmountDecimal.abs()) && borrowAmountDecimal.lt(0)) ||
      borrowAmountDecimal.gte(0),
    [borrowAmountDecimal, debtTokenBalanceValues.amount],
  );

  const formattedMissingBorrowAmount = useMemo(() => {
    if (!tokenBalanceMap[R_TOKEN]) {
      return null;
    }

    const missingBorrowAmount = borrowAmountDecimal.abs().sub(tokenBalanceMap[R_TOKEN]);
    const truncatedMissingBorrowAmount = new Decimal(missingBorrowAmount.toTruncated(2));
    const result = truncatedMissingBorrowAmount.lt(missingBorrowAmount)
      ? truncatedMissingBorrowAmount.add(0.01)
      : missingBorrowAmount;

    return DecimalFormat.format(result, {
      style: 'decimal',
      fractionDigits: 2,
    });
  }, [tokenBalanceMap, borrowAmountDecimal]);

  const hasMinBorrow = useMemo(
    () => !newDebtTokenValues?.amount || newDebtTokenValues.amount.gte(MIN_BORROW_AMOUNT) || isClosePosition,
    [isClosePosition, newDebtTokenValues?.amount],
  );
  const hasMinNewRatio = useMemo(
    () => !newCollateralizationRatio || newCollateralizationRatio.gte(LIQUIDATION_UPPER_RATIO) || isClosePosition,
    [isClosePosition, newCollateralizationRatio],
  );
  const isInputNonEmpty = useMemo(
    () => !(collateralAmountDecimal.isZero() && borrowAmountDecimal.isZero()),
    [borrowAmountDecimal, collateralAmountDecimal],
  );
  const hasWhitelisted = useMemo(() => Boolean(selectedCollateralTokenWhitelist), [selectedCollateralTokenWhitelist]);
  const hasEnoughCollateralAllowance = useMemo(
    () => Boolean(selectedCollateralTokenAllowance?.gte(collateralAmountDecimal)),
    [collateralAmountDecimal, selectedCollateralTokenAllowance],
  );
  const hasEnoughDebtAllowance = useMemo(
    // R token somehow can give MAX allowance which is wrong
    // return true whenever debt amount is -ve and collateral is not wstETH
    () =>
      (borrowAmountDecimal.lt(0) && TOKENS_WITH_PERMIT.has(selectedCollateralToken)) ||
      Boolean(approveStatus?.rPermit) ||
      borrowAmountDecimal.gte(0),
    [approveStatus?.rPermit, borrowAmountDecimal, selectedCollateralToken],
  );
  const hasEnoughToWithdraw = useMemo(() => {
    if (!newCollateralInDisplayToken.amount) {
      return true;
    }

    return newCollateralInDisplayToken.amount.gte(0);
  }, [newCollateralInDisplayToken.amount]);

  const canAdjust = useMemo(
    () =>
      isInputNonEmpty && hasEnoughCollateralTokenBalance && hasEnoughDebtTokenBalance && hasMinBorrow && hasMinNewRatio,
    [isInputNonEmpty, hasEnoughCollateralTokenBalance, hasEnoughDebtTokenBalance, hasMinBorrow, hasMinNewRatio],
  );

  const executionSteps = useMemo(() => {
    const whitelistStep = hasWhitelisted ? 0 : 1;
    const collateralApprovalStep = hasEnoughCollateralAllowance ? 0 : 1;
    const debtApprovalStep = hasEnoughDebtAllowance ? 0 : 1;
    const executionStep = 1;

    return whitelistStep + collateralApprovalStep + debtApprovalStep + executionStep;
  }, [hasEnoughCollateralAllowance, hasEnoughDebtAllowance, hasWhitelisted]);

  const collateralErrorMsg = useMemo(() => {
    if (!hasEnoughCollateralTokenBalance) {
      return 'Insufficient funds';
    }

    if (!hasEnoughToWithdraw) {
      return 'Collateral amount to withdraw larger than current balance';
    }

    if (!hasMinNewRatio) {
      return 'Collateralization ratio is below the minimum threshold';
    }
  }, [hasEnoughCollateralTokenBalance, hasEnoughToWithdraw, hasMinNewRatio]);

  const debtErrorMsg = useMemo(() => {
    if (!hasMinBorrow) {
      return 'Borrow below the minimum amount';
    }

    if (!hasMinNewRatio) {
      return 'Collateralization ratio is below the minimum threshold';
    }
  }, [hasMinBorrow, hasMinNewRatio]);

  const buttonLabel = useMemo(() => {
    if (!hasEnoughDebtTokenBalance) {
      return `You need ${formattedMissingBorrowAmount} more R to close your Position`;
    }

    if (!hasWhitelisted) {
      return transactionState === 'loading'
        ? `Whitelisting stETH (1/${executionSteps})`
        : `Whitelist stETH (1/${executionSteps})`;
    }

    if (!hasEnoughCollateralAllowance) {
      return transactionState === 'loading'
        ? `Approving ${selectedCollateralToken} (1/${executionSteps})`
        : `Approve ${selectedCollateralToken} (1/${executionSteps})`;
    }

    if (!hasEnoughDebtAllowance) {
      return transactionState === 'loading' ? `Approving R (1/${executionSteps})` : `Approve R (1/${executionSteps})`;
    }

    if (closePositionActive && transactionState === 'loading') {
      return 'Executing';
    }

    return 'Execute';
  }, [
    hasEnoughDebtTokenBalance,
    hasWhitelisted,
    hasEnoughCollateralAllowance,
    hasEnoughDebtAllowance,
    formattedMissingBorrowAmount,
    transactionState,
    executionSteps,
    selectedCollateralToken,
    closePositionActive,
  ]);

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

  const onAction = useCallback(() => {
    if (!canAdjust) {
      return null;
    }

    if (!hasWhitelisted) {
      whitelistDelegate({ token: selectedCollateralToken, txnId: uuid() });
      return;
    }

    if (!hasEnoughCollateralAllowance) {
      approve({
        collateralChange: collateralAmountDecimal,
        debtChange: Decimal.ZERO,
        collateralToken: selectedCollateralToken,
        currentUserCollateral: collateralBalance,
        currentUserDebt: debtBalance,
        closePosition: closePositionActive,
        txnId: uuid(),
      });
      return;
    }

    if (!hasEnoughDebtAllowance) {
      approve({
        collateralChange: Decimal.ZERO,
        debtChange: borrowAmountDecimal,
        collateralToken: selectedCollateralToken,
        currentUserCollateral: collateralBalance,
        currentUserDebt: debtBalance,
        closePosition: closePositionActive,
        txnId: uuid(),
      });
      return;
    }

    borrow({
      collateralChange: collateralAmountDecimal,
      debtChange: borrowAmountDecimal,
      collateralToken: selectedCollateralToken,
      currentUserCollateral: collateralBalance,
      currentUserDebt: debtBalance,
      closePosition: closePositionActive,
      txnId: uuid(),
      options: {
        rPermitSignature: approveStatus?.rPermit,
      },
    });
  }, [
    canAdjust,
    hasWhitelisted,
    hasEnoughCollateralAllowance,
    hasEnoughDebtAllowance,
    borrow,
    approve,
    collateralAmountDecimal,
    borrowAmountDecimal,
    selectedCollateralToken,
    collateralBalance,
    debtBalance,
    closePositionActive,
    approveStatus?.rPermit,
    whitelistDelegate,
  ]);

  return (
    <div className="raft__adjustPosition">
      <div className="raft__adjustPosition__header">
        <Typography variant="heading2">Adjust Position</Typography>
        <Button
          variant="secondary"
          text="Close Position"
          onClick={onToggleClosePosition}
          selected={closePositionActive}
        />
      </div>
      <div className="raft__adjustPosition__input">
        <CurrencyInput
          label="ADJUST YOUR COLLATERAL"
          precision={18}
          fiatValue={null}
          selectedToken={selectedCollateralToken}
          tokens={SUPPORTED_COLLATERAL_TOKENS}
          value={collateralAmount}
          onTokenUpdate={handleCollateralTokenChange}
          onValueUpdate={handleCollateralAmountChange}
          disabled={closePositionActive}
          allowNegativeNumbers={true}
          onBlur={handleCollateralAmountBlur}
          error={!hasEnoughCollateralTokenBalance || !hasMinNewRatio || !hasEnoughToWithdraw}
          errorMsg={collateralErrorMsg}
        />
        <CurrencyInput
          label="ADJUST YOUR DEBT"
          precision={18}
          fiatValue={null}
          selectedToken={R_TOKEN}
          tokens={[R_TOKEN]}
          value={borrowAmount}
          onValueUpdate={handleBorrowAmountChange}
          disabled={closePositionActive}
          allowNegativeNumbers={true}
          onBlur={handleBorrowAmountBlur}
          error={!hasMinBorrow || !hasMinNewRatio}
          errorMsg={debtErrorMsg}
          maxIntegralDigits={10}
        />
      </div>
      <div className="raft__adjustPosition__data">
        <div className="raft__adjustPosition__data__position">
          <div className="raft__adjustPosition__data__position__title">
            <Typography variant="overline">POSITION AFTER</Typography>
            <Icon variant="info" size="tiny" />
          </div>
          <ul className="raft__adjustPosition__data__position__data">
            <li className="raft__adjustPosition__data__position__data__deposit">
              <TokenLogo type={`token-${DISPLAY_BASE_TOKEN}`} size={20} />
              <ValueLabel value={newCollateralInDisplayTokenAmountFormatted} valueSize="body" tickerSize="caption" />
              {newCollateralInDisplayToken.valueFormatted && (
                <Typography
                  className="raft__adjustPosition__data__position__data__deposit__value"
                  variant="body"
                  weight="medium"
                  color="text-secondary"
                >
                  (
                  <ValueLabel
                    value={newCollateralInDisplayToken.valueFormatted}
                    tickerSize="caption"
                    valueSize="body"
                    color="text-secondary"
                  />
                  )
                </Typography>
              )}
            </li>
            <li className="raft__adjustPosition__data__position__data__debt">
              <TokenLogo type={`token-${R_TOKEN}`} size={20} />
              <ValueLabel
                value={newDebtTokenValues.amountFormatted ?? `0.00 ${R_TOKEN}`}
                valueSize="body"
                tickerSize="caption"
              />
            </li>
            <li className="raft__adjustPosition__data__position__data__ratio">
              {!currentCollateralizationRatio ||
              !newCollateralizationRatio ||
              currentCollateralizationRatio.equals(newCollateralizationRatio) ? (
                <div className="raft__adjustPosition__data__position__data__ratio__empty-status" />
              ) : (
                <Icon
                  variant={currentCollateralizationRatio.gt(newCollateralizationRatio) ? 'arrow-down' : 'arrow-up'}
                  size="tiny"
                />
              )}
              {newCollateralRatioLevel && (
                <div
                  className={`raft__adjustPosition__data__position__data__ratio__status status-${newCollateralRatioLevel}`}
                />
              )}
              <ValueLabel value={newCollateralizationRatioFormatted} valueSize="body" tickerSize="caption" />
              <Typography variant="body" weight="medium" color="text-secondary">
                {newCollateralRatioLabel ? `(${newCollateralRatioLabel})` : ''}
              </Typography>
            </li>
          </ul>
        </div>
        <div className="raft__adjustPosition__data__others">
          <div className="raft__adjustPosition__data__protocol-fee__title">
            <Typography variant="overline">PROTOCOL FEES</Typography>
            <Icon variant="info" size="tiny" />
          </div>
          <div className="raft__adjustPosition__data__protocol-fee__value">
            <Typography variant="body" weight="medium">
              Free
            </Typography>
          </div>
        </div>
      </div>
      <div className="raft__adjustPosition__action">
        <Button variant="primary" size="large" onClick={onAction} disabled={buttonDisabled}>
          {transactionState === 'loading' && <Loading />}
          <Typography variant="button-label" color="text-primary-inverted">
            {buttonLabel}
          </Typography>
        </Button>
      </div>
    </div>
  );
};
export default AdjustPosition;
