import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Decimal } from '@tempusfinance/decimal';
import { ButtonWrapper } from 'tempus-ui';
import { MIN_COLLATERAL_RATIO, R_TOKEN } from '@raft-fi/sdk';
import {
  useCollateralBorrowingRates,
  useCollateralConversionRates,
  useCollateralPositionCaps,
  useCollateralProtocolCaps,
  useCollateralTokenConfig,
  useManage,
  useProtocolStats,
  useTokenBalances,
  useTokenPrices,
} from '../../hooks';
import {
  formatCurrency,
  formatDecimal,
  formatPercentage,
  getDecimalFromTokenMap,
  getTokenValues,
  isCollateralToken,
  isUnderlyingCollateralToken,
} from '../../utils';
import {
  INPUT_PREVIEW_DIGITS,
  MINIMUM_UI_AMOUNT_FOR_BORROW_FEE,
  MIN_BORROW_AMOUNT,
  R_TOKEN_UI_PRECISION,
  SUPPORTED_COLLATERAL_TOKEN_SETTINGS,
  TOKEN_TO_DISPLAY_BASE_TOKEN_MAP,
  TOKEN_TO_UNDERLYING_TOKEN_MAP,
} from '../../constants';
import { Nullable, Position, SupportedCollateralToken, SupportedUnderlyingCollateralToken } from '../../interfaces';
import { Button, CurrencyInput, Typography, ExecuteButton } from '../shared';
import { PositionAfter } from '../Position';

import './AdjustPosition.scss';

interface AdjustPositionProps {
  position: Position;
}

const AdjustPosition: FC<AdjustPositionProps> = ({ position }) => {
  const tokenBalanceMap = useTokenBalances();
  const tokenPriceMap = useTokenPrices();
  const borrowingRateMap = useCollateralBorrowingRates();
  const collateralConversionRateMap = useCollateralConversionRates();
  const collateralPositionCapMap = useCollateralPositionCaps();
  const collateralProtocolCapMap = useCollateralProtocolCaps();
  const protocolStats = useProtocolStats();
  const { collateralTokenConfig, setCollateralTokenForConfig } = useCollateralTokenConfig();
  const { managePositionStatus, managePosition, managePositionStepsStatus, requestManagePositionStep } = useManage();

  const { collateralBalance, debtBalance } = position;
  // already checked underlyingCollateralToken is not null to render this component
  const underlyingCollateralToken = position.underlyingCollateralToken as SupportedUnderlyingCollateralToken;
  const displayBaseToken = SUPPORTED_COLLATERAL_TOKEN_SETTINGS[underlyingCollateralToken].displayBaseToken;

  const [selectedCollateralToken, setSelectedCollateralToken] = useState<SupportedCollateralToken>(displayBaseToken);
  const [collateralAmount, setCollateralAmount] = useState<string>('');
  const [borrowAmount, setBorrowAmount] = useState<string>('');
  const [isAddCollateral, setIsAddCollateral] = useState<boolean>(true);
  const [isAddDebt, setIsAddDebt] = useState<boolean>(true);
  const [closePositionActive, setClosePositionActive] = useState<boolean>(false);
  const [transactionState, setTransactionState] = useState<string>('default');

  // when selectedCollateralToken changed, change the token config as well
  useEffect(() => {
    setCollateralTokenForConfig(selectedCollateralToken);
  }, [selectedCollateralToken, setCollateralTokenForConfig]);

  const handleCollateralTokenChange = useCallback((token: string) => {
    if (isCollateralToken(token)) {
      setSelectedCollateralToken(token);
    }
  }, []);

  const handleCollateralAmountBlur = useCallback(() => {
    const decimal = Decimal.parse(collateralAmount, 0);
    if (decimal.isZero()) {
      setCollateralAmount('');
    }
  }, [collateralAmount]);
  const handleBorrowAmountBlur = useCallback(() => {
    const decimal = Decimal.parse(borrowAmount, 0);
    if (decimal.isZero()) {
      setBorrowAmount('');
    }
  }, [borrowAmount]);

  const selectedCollateralBorrowRate = useMemo(
    () =>
      getDecimalFromTokenMap<SupportedUnderlyingCollateralToken>(
        borrowingRateMap,
        collateralTokenConfig?.underlyingTokenTicker ?? null,
      ),
    [borrowingRateMap, collateralTokenConfig],
  );

  const collateralAmountDecimal = useMemo(() => Decimal.parse(collateralAmount, 0), [collateralAmount]);
  const borrowAmountDecimal = useMemo(() => Decimal.parse(borrowAmount, 0), [borrowAmount]);
  const collateralAmountWithEllipse = useMemo(() => {
    const original = collateralAmountDecimal.toString();
    const truncated = collateralAmountDecimal.toTruncated(INPUT_PREVIEW_DIGITS);

    return original === truncated ? original : `${truncated}...`;
  }, [collateralAmountDecimal]);
  const borrowAmountWithEllipse = useMemo(() => {
    const original = borrowAmountDecimal.toString();
    const truncated = borrowAmountDecimal.toTruncated(INPUT_PREVIEW_DIGITS);

    return original === truncated ? original : `${truncated}...`;
  }, [borrowAmountDecimal]);

  const selectedCollateralTokenProtocolCap = useMemo(
    () => getDecimalFromTokenMap(collateralProtocolCapMap, selectedCollateralToken),
    [collateralProtocolCapMap, selectedCollateralToken],
  );
  const selectedCollateralTokenPositionCap = useMemo(
    () => getDecimalFromTokenMap(collateralPositionCapMap, selectedCollateralToken),
    [collateralPositionCapMap, selectedCollateralToken],
  );

  const debtTokenBalanceValues = useMemo(
    () => getTokenValues(tokenBalanceMap[R_TOKEN], tokenPriceMap[R_TOKEN], R_TOKEN),
    [tokenBalanceMap, tokenPriceMap],
  );

  const borrowingFeeAmount = useMemo(() => {
    if (!selectedCollateralBorrowRate) {
      return null;
    }

    if (borrowAmountDecimal.isZero() || !isAddDebt) {
      return Decimal.ZERO;
    }

    return borrowAmountDecimal.mul(selectedCollateralBorrowRate);
  }, [borrowAmountDecimal, selectedCollateralBorrowRate, isAddDebt]);

  /**
   * Current user collateral denominated in underlying collateral token
   */
  const currentUnderlyingCollateralTokenValues = useMemo(
    () => getTokenValues(collateralBalance, tokenPriceMap[underlyingCollateralToken], underlyingCollateralToken),
    [collateralBalance, tokenPriceMap, underlyingCollateralToken],
  );

  /**
   * wallet balance for the selected collateral token
   */
  const selectedCollateralTokenBalance = useMemo(
    () => tokenBalanceMap[selectedCollateralToken],
    [selectedCollateralToken, tokenBalanceMap],
  );

  /**
   * New user collateral denominated in underlying collateral token
   */
  const newCollateralInUnderlyingTokenAmount = useMemo(() => {
    const collateralConversionRate = collateralConversionRateMap?.[selectedCollateralToken];

    if (!collateralConversionRate || collateralConversionRate.isZero()) {
      return null;
    }

    if (closePositionActive) {
      return Decimal.ZERO;
    }

    if (isUnderlyingCollateralToken(selectedCollateralToken)) {
      return collateralBalance.add(collateralAmountDecimal.mul(isAddCollateral ? 1 : -1));
    } else {
      return collateralBalance.add(
        collateralAmountDecimal.mul(Decimal.ONE.div(collateralConversionRate)).mul(isAddCollateral ? 1 : -1),
      );
    }
  }, [
    closePositionActive,
    collateralAmountDecimal,
    collateralBalance,
    collateralConversionRateMap,
    isAddCollateral,
    selectedCollateralToken,
  ]);

  /**
   * New user underlying collateral values
   */
  const newCollateralInUnderlyingTokenValues = useMemo(
    () =>
      getTokenValues(
        newCollateralInUnderlyingTokenAmount,
        tokenPriceMap[underlyingCollateralToken],
        underlyingCollateralToken,
      ),
    [newCollateralInUnderlyingTokenAmount, tokenPriceMap, underlyingCollateralToken],
  );

  /**
   * New user collateral denominated in display collateral token
   */
  const newCollateralInDisplayTokenAmount = useMemo(() => {
    if (!newCollateralInUnderlyingTokenValues.amount) {
      return Decimal.ZERO;
    }

    const displayBaseTokenConversionRate = collateralConversionRateMap?.[displayBaseToken];

    // if conversion rate not available, return null
    if (!displayBaseTokenConversionRate) {
      return null;
    }

    // display token amount = input amount * display token rate
    return newCollateralInUnderlyingTokenValues.amount.mul(displayBaseTokenConversionRate);
  }, [newCollateralInUnderlyingTokenValues.amount, collateralConversionRateMap, displayBaseToken]);

  /**
   * New user display collateral values
   */
  const newCollateralInDisplayTokenValues = useMemo(
    () => getTokenValues(newCollateralInDisplayTokenAmount, tokenPriceMap[displayBaseToken], displayBaseToken),
    [displayBaseToken, newCollateralInDisplayTokenAmount, tokenPriceMap],
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
  const newDebtTokenWithFeeValues = useMemo(() => {
    let newValue;

    if (isAddDebt) {
      newValue = debtBalance.add(borrowAmountDecimal.add(borrowingFeeAmount ?? Decimal.ZERO));
    } else {
      newValue = debtBalance.sub(borrowAmountDecimal);
    }

    return getTokenValues(newValue, tokenPriceMap[R_TOKEN], R_TOKEN);
  }, [borrowAmountDecimal, borrowingFeeAmount, debtBalance, isAddDebt, tokenPriceMap]);

  /**
   * Current collateralization ratio
   */
  const currentCollateralizationRatio = useMemo(() => {
    if (!currentUnderlyingCollateralTokenValues?.value || !currentDebtTokenValues.value) {
      return null;
    }

    if (currentDebtTokenValues.value.isZero()) {
      return null;
    }

    return currentUnderlyingCollateralTokenValues.value.div(currentDebtTokenValues.value);
  }, [currentUnderlyingCollateralTokenValues?.value, currentDebtTokenValues.value]);

  /**
   * New collateralization ratio
   */
  const newCollateralizationRatio = useMemo(() => {
    const collateralValue = newCollateralInUnderlyingTokenValues?.value || currentUnderlyingCollateralTokenValues.value;
    const debtValue = newDebtTokenWithFeeValues?.value || currentDebtTokenValues?.value;

    if (!collateralValue || !debtValue || debtValue.lte(0)) {
      return null;
    }

    if (collateralValue.isZero()) {
      return Decimal.ZERO;
    }

    return collateralValue.div(debtValue);
  }, [
    newCollateralInUnderlyingTokenValues?.value,
    currentUnderlyingCollateralTokenValues.value,
    newDebtTokenWithFeeValues?.value,
    currentDebtTokenValues?.value,
  ]);

  const selectedCollateralTokenPrice = useMemo(
    () => getDecimalFromTokenMap(tokenPriceMap, selectedCollateralToken),
    [selectedCollateralToken, tokenPriceMap],
  );
  const liquidationPrice = useMemo(() => {
    if (
      !selectedCollateralTokenPrice ||
      !newCollateralizationRatio ||
      newCollateralizationRatio.equals(Decimal.MAX_DECIMAL)
    ) {
      return null;
    }

    return selectedCollateralTokenPrice
      .div(newCollateralizationRatio)
      .mul(MIN_COLLATERAL_RATIO[underlyingCollateralToken]);
  }, [newCollateralizationRatio, selectedCollateralTokenPrice, underlyingCollateralToken]);
  const liquidationPriceDropPercent = useMemo(() => {
    if (!liquidationPrice || !selectedCollateralTokenPrice) {
      return null;
    }

    return Decimal.max(selectedCollateralTokenPrice.sub(liquidationPrice).div(selectedCollateralTokenPrice), 0);
  }, [liquidationPrice, selectedCollateralTokenPrice]);

  useEffect(() => {
    const isZeroCollateralInNewPosition = newCollateralInUnderlyingTokenValues.amount?.isZero();
    const isZeroDebtInNewPosition = newDebtTokenWithFeeValues.amount?.isZero();
    const isManualClosePosition = isZeroCollateralInNewPosition && isZeroDebtInNewPosition;

    requestManagePositionStep?.({
      underlyingCollateralToken: TOKEN_TO_UNDERLYING_TOKEN_MAP[selectedCollateralToken],
      collateralToken: selectedCollateralToken,
      collateralChange: collateralAmountDecimal.mul(isAddCollateral ? 1 : -1),
      debtChange: borrowAmountDecimal.mul(isAddDebt ? 1 : -1),
      isClosePosition: closePositionActive || isManualClosePosition,
    });
  }, [
    borrowAmountDecimal,
    closePositionActive,
    collateralAmountDecimal,
    isAddCollateral,
    isAddDebt,
    newCollateralInUnderlyingTokenValues.amount,
    newDebtTokenWithFeeValues.amount,
    requestManagePositionStep,
    selectedCollateralToken,
  ]);

  const executionSteps = useMemo(
    () => managePositionStepsStatus.result?.numberOfSteps,
    [managePositionStepsStatus.result?.numberOfSteps],
  );
  const currentExecutionSteps = useMemo(
    () => managePositionStepsStatus.result?.stepNumber,
    [managePositionStepsStatus.result?.stepNumber],
  );
  const executionType = useMemo(
    () => managePositionStepsStatus.result?.type?.name ?? null,
    [managePositionStepsStatus.result?.type],
  );
  const tokenNeedsToBeApproved = useMemo(
    () =>
      executionType && ['approve', 'permit'].includes(executionType)
        ? managePositionStepsStatus.result?.type?.token ?? null
        : null,
    [executionType, managePositionStepsStatus.result?.type?.token],
  );

  const collateralSupply: Nullable<Decimal> = useMemo(
    () => protocolStats?.collateralSupply[underlyingCollateralToken] ?? null,
    [protocolStats?.collateralSupply, underlyingCollateralToken],
  );

  const isClosePosition = useMemo(
    () => newDebtTokenWithFeeValues?.amount?.isZero() && newCollateralInDisplayTokenValues?.value?.isZero(),
    [newCollateralInDisplayTokenValues?.value, newDebtTokenWithFeeValues?.amount],
  );
  const hasEnoughCollateralTokenBalance = useMemo(
    () => selectedCollateralTokenBalance?.gte(collateralAmountDecimal) || !isAddCollateral,
    [collateralAmountDecimal, isAddCollateral, selectedCollateralTokenBalance],
  );
  const hasEnoughDebtTokenBalance = useMemo(
    () =>
      !debtTokenBalanceValues.amount ||
      (debtTokenBalanceValues.amount.gte(borrowAmountDecimal) && !isAddDebt) ||
      isAddDebt,
    [borrowAmountDecimal, debtTokenBalanceValues.amount, isAddDebt],
  );
  const hasNonNegativeDebt = useMemo(
    () => !newDebtTokenWithFeeValues.amount?.lt(0),
    [newDebtTokenWithFeeValues.amount],
  );
  const hasNonEmptyInput = useMemo(
    () => !collateralAmountDecimal.isZero() || !borrowAmountDecimal.isZero(),
    [borrowAmountDecimal, collateralAmountDecimal],
  );

  const formattedMissingBorrowAmount = useMemo(() => {
    if (!tokenBalanceMap[R_TOKEN]) {
      return null;
    }

    const missingBorrowAmount = borrowAmountDecimal.sub(tokenBalanceMap[R_TOKEN]);
    const truncatedMissingBorrowAmount = new Decimal(missingBorrowAmount.toTruncated(R_TOKEN_UI_PRECISION));
    const result = truncatedMissingBorrowAmount.lt(missingBorrowAmount)
      ? truncatedMissingBorrowAmount.add(0.01)
      : missingBorrowAmount;

    return formatDecimal(result, R_TOKEN_UI_PRECISION);
  }, [tokenBalanceMap, borrowAmountDecimal]);

  const hasMinBorrow = useMemo(
    () =>
      !newDebtTokenWithFeeValues?.amount || newDebtTokenWithFeeValues.amount.gte(MIN_BORROW_AMOUNT) || isClosePosition,
    [isClosePosition, newDebtTokenWithFeeValues?.amount],
  );
  const hasMinNewRatio = useMemo(
    () =>
      !newCollateralizationRatio ||
      newCollateralizationRatio.gte(MIN_COLLATERAL_RATIO[underlyingCollateralToken]) ||
      isClosePosition,
    [isClosePosition, newCollateralizationRatio, underlyingCollateralToken],
  );
  const isInputNonEmpty = useMemo(
    () => !(collateralAmountDecimal.isZero() && borrowAmountDecimal.isZero()),
    [borrowAmountDecimal, collateralAmountDecimal],
  );
  const hasEnoughToWithdraw = useMemo(() => {
    if (!newCollateralInDisplayTokenValues.amount) {
      return true;
    }

    return newCollateralInDisplayTokenValues.amount.gte(0);
  }, [newCollateralInDisplayTokenValues.amount]);

  const isPositionWithinCollateralPositionCap = useMemo(() => {
    // In case user is not adding collateral, we should ignore cap
    if (collateralAmountDecimal.isZero() || !isAddCollateral) {
      return true;
    }

    if (!collateralSupply || !selectedCollateralTokenPositionCap || !newCollateralInUnderlyingTokenValues.amount) {
      return false;
    }

    // TODO: assume 1:1 of the token rate here, should calculate the conversion rate
    return newCollateralInUnderlyingTokenValues.amount.lte(selectedCollateralTokenPositionCap);
  }, [
    collateralAmountDecimal,
    collateralSupply,
    isAddCollateral,
    newCollateralInUnderlyingTokenValues.amount,
    selectedCollateralTokenPositionCap,
  ]);

  const isPositionWithinCollateralProtocolCap = useMemo(() => {
    // In case user is not adding collateral, we should ignore cap
    if (collateralAmountDecimal.isZero() || !isAddCollateral) {
      return true;
    }

    if (
      !collateralSupply ||
      !selectedCollateralTokenProtocolCap ||
      !currentUnderlyingCollateralTokenValues.amount ||
      !newCollateralInUnderlyingTokenValues.amount
    ) {
      return false;
    }

    const pureCollateralSupply = collateralSupply.sub(currentUnderlyingCollateralTokenValues.amount);

    // TODO: assume 1:1 of the token rate here, should calculate the conversion rate
    return newCollateralInUnderlyingTokenValues.amount
      .add(pureCollateralSupply)
      .lte(selectedCollateralTokenProtocolCap);
  }, [
    collateralAmountDecimal,
    collateralSupply,
    currentUnderlyingCollateralTokenValues.amount,
    isAddCollateral,
    newCollateralInUnderlyingTokenValues.amount,
    selectedCollateralTokenProtocolCap,
  ]);

  const isTotalSupplyWithinCollateralProtocolCap = useMemo(() => {
    // In case user is not adding collateral, we should ignore cap
    if (collateralAmountDecimal.isZero() || !isAddCollateral) {
      return true;
    }

    if (!collateralSupply || !selectedCollateralTokenProtocolCap) {
      return false;
    }

    return collateralSupply.lte(selectedCollateralTokenProtocolCap);
  }, [collateralAmountDecimal, collateralSupply, isAddCollateral, selectedCollateralTokenProtocolCap]);

  const isPositionWithinDebtPositionCap = useMemo(() => {
    // In case user is repaying his debt, we should ignore max borrow limit
    if (!isAddDebt) {
      return true;
    }

    // Do not show error if user did not input anything.
    if (!borrowAmount) {
      return true;
    }

    // only wstETH group has this requirement
    if (selectedCollateralToken === 'wstETH') {
      const debtSupply = protocolStats?.debtSupply.wstETH;

      if (!debtSupply || !newDebtTokenWithFeeValues.amount) {
        return false;
      }

      const pureDebtSupply = debtSupply.sub(debtBalance);

      const maxBorrowAmount = pureDebtSupply.div(10);
      return newDebtTokenWithFeeValues.amount.lte(maxBorrowAmount);
    }

    return true;
  }, [
    borrowAmount,
    debtBalance,
    isAddDebt,
    newDebtTokenWithFeeValues.amount,
    protocolStats?.debtSupply.wstETH,
    selectedCollateralToken,
  ]);

  const errPositionOutOfCollateralPositionCap = useMemo(
    () => !isPositionWithinCollateralPositionCap && Boolean(selectedCollateralTokenPositionCap),
    [isPositionWithinCollateralPositionCap, selectedCollateralTokenPositionCap],
  );
  const errPositionOutOfCollateralProtocolCap = useMemo(
    () => !isPositionWithinCollateralProtocolCap && Boolean(selectedCollateralTokenProtocolCap),
    [isPositionWithinCollateralProtocolCap, selectedCollateralTokenProtocolCap],
  );
  const errTotalSupplyOutOfCollateralProtocolCap = useMemo(
    () => !isTotalSupplyWithinCollateralProtocolCap && Boolean(selectedCollateralTokenProtocolCap),
    [isTotalSupplyWithinCollateralProtocolCap, selectedCollateralTokenProtocolCap],
  );

  const canAdjust = useMemo(
    () =>
      Boolean(
        isInputNonEmpty &&
          hasEnoughCollateralTokenBalance &&
          hasEnoughDebtTokenBalance &&
          hasMinBorrow &&
          hasMinNewRatio &&
          isPositionWithinCollateralPositionCap &&
          isPositionWithinCollateralProtocolCap &&
          isTotalSupplyWithinCollateralProtocolCap &&
          isPositionWithinDebtPositionCap,
      ),
    [
      isInputNonEmpty,
      hasEnoughCollateralTokenBalance,
      hasEnoughDebtTokenBalance,
      hasMinBorrow,
      hasMinNewRatio,
      isPositionWithinCollateralPositionCap,
      isPositionWithinCollateralProtocolCap,
      isTotalSupplyWithinCollateralProtocolCap,
      isPositionWithinDebtPositionCap,
    ],
  );

  const collateralErrorMsg = useMemo(() => {
    if (!hasEnoughCollateralTokenBalance) {
      return 'Insufficient funds';
    }

    if (errPositionOutOfCollateralPositionCap) {
      const collateralPositionCapFormatted = formatCurrency(collateralPositionCapMap[selectedCollateralToken], {
        currency: selectedCollateralToken,
        fractionDigits: 0,
      });
      return (
        `Deposit amount exceeds the position collateral cap of ${collateralPositionCapFormatted}. ` +
        `Please reduce the deposit amount.`
      );
    }

    if (errPositionOutOfCollateralProtocolCap) {
      return `The deposit amount exceeds collateral capacity. Please reduce the deposit amount and try again`;
    }

    if (!hasEnoughToWithdraw) {
      return 'Collateral amount to withdraw larger than current balance';
    }

    if (!hasMinNewRatio) {
      return 'Collateralization ratio is below the minimum threshold';
    }
  }, [
    collateralPositionCapMap,
    errPositionOutOfCollateralPositionCap,
    errPositionOutOfCollateralProtocolCap,
    hasEnoughCollateralTokenBalance,
    hasEnoughToWithdraw,
    hasMinNewRatio,
    selectedCollateralToken,
  ]);

  const debtErrorMsg = useMemo(() => {
    if (!hasNonNegativeDebt) {
      return 'Repayment amount larger than your outstanding debt';
    }

    if (!hasMinBorrow) {
      return 'Borrow below the minimum amount';
    }

    if (!hasMinNewRatio) {
      return 'Collateralization ratio is below the minimum threshold';
    }

    if (errTotalSupplyOutOfCollateralProtocolCap) {
      return 'Amount exceeds maximum debt allowed per Position';
    }
  }, [errTotalSupplyOutOfCollateralProtocolCap, hasMinBorrow, hasMinNewRatio, hasNonNegativeDebt]);

  const buttonLabel = useMemo(() => {
    if (!isTotalSupplyWithinCollateralProtocolCap && !managePositionStatus.pending) {
      const collateralProtocolCapFormatted = formatCurrency(collateralProtocolCapMap[selectedCollateralToken], {
        currency: selectedCollateralToken,
        fractionDigits: 0,
      });
      return `Protocol collateral cap of ${collateralProtocolCapFormatted} reached. Please check again later.`;
    }

    if (!hasEnoughDebtTokenBalance && hasNonNegativeDebt && !managePositionStatus.pending) {
      return `You need ${formattedMissingBorrowAmount} more R to close your Position`;
    }

    if (executionSteps === 1) {
      return managePositionStatus.pending ? 'Executing' : 'Execute';
    }

    if (executionType === 'whitelist') {
      return managePositionStatus.pending
        ? `Whitelisting ${selectedCollateralToken} (${currentExecutionSteps}/${executionSteps})`
        : `Whitelist ${selectedCollateralToken} (${currentExecutionSteps}/${executionSteps})`;
    }

    if (executionType === 'approve' || executionType === 'permit') {
      return managePositionStatus.pending
        ? `Approving ${tokenNeedsToBeApproved} (${currentExecutionSteps}/${executionSteps})`
        : `Approve ${tokenNeedsToBeApproved} (${currentExecutionSteps}/${executionSteps})`;
    }

    if (executionType === 'manage') {
      return managePositionStatus.pending
        ? `Executing (${currentExecutionSteps}/${executionSteps})`
        : `Execute (${currentExecutionSteps}/${executionSteps})`;
    }

    // input is still empty, showing default button text
    if (!hasNonEmptyInput) {
      return 'Execute';
    }

    // executionType is null but input non-empty, still loading
    return 'Loading';
  }, [
    isTotalSupplyWithinCollateralProtocolCap,
    managePositionStatus.pending,
    hasEnoughDebtTokenBalance,
    hasNonNegativeDebt,
    executionSteps,
    executionType,
    hasNonEmptyInput,
    collateralProtocolCapMap,
    selectedCollateralToken,
    formattedMissingBorrowAmount,
    currentExecutionSteps,
    tokenNeedsToBeApproved,
  ]);

  const borrowingFeePercentageFormatted = useMemo(() => {
    if (!selectedCollateralBorrowRate || !borrowingFeeAmount) {
      return null;
    }

    if (selectedCollateralBorrowRate.isZero() || borrowingFeeAmount.isZero()) {
      return 'Free';
    }

    return formatPercentage(selectedCollateralBorrowRate);
  }, [borrowingFeeAmount, selectedCollateralBorrowRate]);

  const borrowingFeeAmountFormatted = useMemo(() => {
    if (!borrowingFeeAmount || borrowingFeeAmount.isZero()) {
      return null;
    }

    const borrowingFeeAmountFormatted = formatCurrency(borrowingFeeAmount, {
      currency: R_TOKEN,
      fractionDigits: R_TOKEN_UI_PRECISION,
      lessThanFormat: true,
      pad: true,
    });

    if (borrowingFeeAmount.gte(MINIMUM_UI_AMOUNT_FOR_BORROW_FEE)) {
      return `~${borrowingFeeAmountFormatted}`;
    } else {
      return borrowingFeeAmountFormatted;
    }
  }, [borrowingFeeAmount]);

  const onToggleClosePosition = useCallback(() => {
    if (!closePositionActive) {
      if (isUnderlyingCollateralToken(selectedCollateralToken)) {
        setCollateralAmount(collateralBalance.toString());
        setIsAddCollateral(false);
      } else {
        const collateralConversionRate = collateralConversionRateMap?.[selectedCollateralToken];

        if (currentUnderlyingCollateralTokenValues.amount && collateralConversionRate) {
          const collateralBalanceInSelectedCollateralToken = collateralBalance.mul(collateralConversionRate);
          setCollateralAmount(collateralBalanceInSelectedCollateralToken.toString());
          setIsAddCollateral(false);
        }
      }

      setBorrowAmount(debtBalance.toString());
      setIsAddDebt(false);
    } else if (collateralBalance && debtBalance) {
      setCollateralAmount('');
      setBorrowAmount('');
      setIsAddCollateral(true);
      setIsAddDebt(true);
    }

    setClosePositionActive(prevState => !prevState);
  }, [
    closePositionActive,
    collateralBalance,
    collateralConversionRateMap,
    currentUnderlyingCollateralTokenValues.amount,
    debtBalance,
    selectedCollateralToken,
  ]);

  const onAction = useCallback(() => {
    if (!canAdjust) {
      return null;
    }

    managePosition?.();
  }, [canAdjust, managePosition]);

  /**
   * Update action button state based on current borrow request status
   */
  useEffect(() => {
    if (managePositionStatus.pending || managePositionStepsStatus.pending || (hasNonEmptyInput && !executionType)) {
      setTransactionState('loading');
    } else if (managePositionStatus.success) {
      setTransactionState('success');
    } else {
      setTransactionState('default');
    }
  }, [
    executionType,
    hasNonEmptyInput,
    managePositionStatus.pending,
    managePositionStatus.success,
    managePositionStepsStatus.pending,
  ]);

  const collateralLabelComponent = useMemo(
    () => (
      <>
        <ButtonWrapper
          className="raft__adjustPosition__input-deposit"
          selected={isAddCollateral}
          onClick={() => setIsAddCollateral(true)}
        >
          <Typography variant="overline" weight="semi-bold">
            DEPOSIT
          </Typography>
        </ButtonWrapper>
        <ButtonWrapper
          className="raft__adjustPosition__input-withdraw"
          selected={!isAddCollateral}
          onClick={() => setIsAddCollateral(false)}
        >
          <Typography variant="overline" weight="semi-bold">
            WITHDRAW
          </Typography>
        </ButtonWrapper>
      </>
    ),
    [isAddCollateral],
  );

  const debtLabelComponent = useMemo(
    () => (
      <>
        <ButtonWrapper
          className="raft__adjustPosition__input-borrow"
          selected={isAddDebt}
          onClick={() => setIsAddDebt(true)}
        >
          <Typography variant="overline" weight="semi-bold">
            GENERATE
          </Typography>
        </ButtonWrapper>
        <ButtonWrapper
          className="raft__adjustPosition__input-repay"
          selected={!isAddDebt}
          onClick={() => setIsAddDebt(false)}
        >
          <Typography variant="overline" weight="semi-bold">
            REPAY
          </Typography>
        </ButtonWrapper>
      </>
    ),
    [isAddDebt],
  );

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
          label={collateralLabelComponent}
          precision={18}
          selectedToken={selectedCollateralToken}
          tokens={SUPPORTED_COLLATERAL_TOKEN_SETTINGS[underlyingCollateralToken].tokens}
          value={collateralAmount}
          previewValue={collateralAmountWithEllipse}
          onTokenUpdate={handleCollateralTokenChange}
          onValueUpdate={setCollateralAmount}
          disabled={closePositionActive}
          onBlur={handleCollateralAmountBlur}
          error={
            !hasEnoughCollateralTokenBalance ||
            !hasMinNewRatio ||
            !hasEnoughToWithdraw ||
            !errPositionOutOfCollateralPositionCap ||
            !errPositionOutOfCollateralProtocolCap
          }
          errorMsg={collateralErrorMsg}
        />
        <CurrencyInput
          label={debtLabelComponent}
          precision={18}
          selectedToken={R_TOKEN}
          tokens={[R_TOKEN]}
          value={borrowAmount}
          previewValue={borrowAmountWithEllipse}
          onValueUpdate={setBorrowAmount}
          disabled={closePositionActive}
          onBlur={handleBorrowAmountBlur}
          error={!hasMinBorrow || !hasMinNewRatio || errTotalSupplyOutOfCollateralProtocolCap}
          errorMsg={debtErrorMsg}
          maxIntegralDigits={10}
        />
      </div>
      <PositionAfter
        displayCollateralToken={TOKEN_TO_DISPLAY_BASE_TOKEN_MAP[selectedCollateralToken]}
        displayCollateralTokenAmount={newCollateralInDisplayTokenValues.amount}
        collateralTokenValueFormatted={newCollateralInUnderlyingTokenValues.valueFormatted}
        borrowTokenAmountFormatted={newDebtTokenWithFeeValues.amountFormatted}
        previousCollateralizationRatio={currentCollateralizationRatio}
        collateralizationRatio={newCollateralizationRatio}
        liquidationPrice={liquidationPrice}
        liquidationPriceChange={liquidationPriceDropPercent}
        borrowingFeePercentageFormatted={borrowingFeePercentageFormatted}
        borrowingFeeAmountFormatted={borrowingFeeAmountFormatted}
      />
      <ExecuteButton
        actionButtonState={transactionState}
        canExecute={canAdjust}
        buttonLabel={buttonLabel}
        walletConnected={true}
        onClick={onAction}
      />
    </div>
  );
};
export default AdjustPosition;
