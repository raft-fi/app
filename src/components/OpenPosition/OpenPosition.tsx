import { useCallback, useEffect, useMemo, useState } from 'react';
import { Decimal } from '@tempusfinance/decimal';
import { useConnectWallet } from '@web3-onboard/react';
import { MIN_COLLATERAL_RATIO, R_TOKEN } from '@raft-fi/sdk';
import {
  useWallet,
  useTokenPrices,
  useTokenBalances,
  useNetwork,
  useCollateralBorrowingRates,
  useCollateralConversionRates,
  useProtocolStats,
  useCollateralTokenConfig,
  useCollateralPositionCaps,
  useCollateralProtocolCaps,
  useManage,
} from '../../hooks';
import {
  COLLATERAL_TOKEN_UI_PRECISION,
  HEALTHY_RATIO,
  HEALTHY_RATIO_BUFFER,
  INPUT_PREVIEW_DIGITS,
  MIN_BORROW_AMOUNT,
  R_TOKEN_UI_PRECISION,
  SUPPORTED_COLLATERAL_TOKENS,
  TOKEN_TO_DISPLAY_BASE_TOKEN_MAP,
  TOKEN_TO_UNDERLYING_TOKEN_MAP,
} from '../../constants';
import { Nullable, SupportedCollateralToken, SupportedUnderlyingCollateralToken } from '../../interfaces';
import {
  formatCurrency,
  formatDecimal,
  formatPercentage,
  getDecimalFromTokenMap,
  getTokenValues,
  isCollateralToken,
  isDisplayBaseToken,
} from '../../utils';
import { Button, CurrencyInput, Typography } from '../shared';
import { PositionAfter, PositionAction } from '../Position';

import './OpenPosition.scss';

const OpenPosition = () => {
  const [, connect] = useConnectWallet();
  const { isWrongNetwork } = useNetwork();

  const protocolStats = useProtocolStats();
  const tokenPriceMap = useTokenPrices();
  const tokenBalanceMap = useTokenBalances();
  const wallet = useWallet();
  const borrowingRateMap = useCollateralBorrowingRates();
  const collateralConversionRateMap = useCollateralConversionRates();
  const collateralPositionCapMap = useCollateralPositionCaps();
  const collateralProtocolCapMap = useCollateralProtocolCaps();
  const { collateralTokenConfig, setCollateralTokenForConfig } = useCollateralTokenConfig();
  const { managePositionStatus, managePosition, managePositionStepsStatus, requestManagePositionStep } = useManage();

  const [selectedCollateralToken, setSelectedCollateralToken] = useState<SupportedCollateralToken>(
    SUPPORTED_COLLATERAL_TOKENS[0],
  );
  const [collateralAmount, setCollateralAmount] = useState<string>('');
  const [borrowAmount, setBorrowAmount] = useState<string>('');
  const [actionButtonState, setActionButtonState] = useState<string>('default');
  const [maxButtonDisabled, setMaxButtonDisabled] = useState<boolean>(false);
  const [hasChanged, setHasChanged] = useState<boolean>(false);

  const selectedUnderlyingCollateralToken = useMemo(
    () => TOKEN_TO_UNDERLYING_TOKEN_MAP[selectedCollateralToken],
    [selectedCollateralToken],
  );
  /**
   * Deposit values of currently selected collateral token
   */
  const selectedCollateralTokenInputValues = useMemo(
    () => getTokenValues(collateralAmount, tokenPriceMap[selectedCollateralToken], selectedCollateralToken),
    [collateralAmount, selectedCollateralToken, tokenPriceMap],
  );

  const collateralAmountDecimal = useMemo(() => Decimal.parse(collateralAmount, 0), [collateralAmount]);
  const borrowAmountDecimal = useMemo(() => Decimal.parse(borrowAmount, 0), [borrowAmount]);

  const selectedCollateralBorrowRate = useMemo(
    () =>
      getDecimalFromTokenMap<SupportedUnderlyingCollateralToken>(
        borrowingRateMap,
        collateralTokenConfig?.underlyingTokenTicker ?? null,
      ),
    [borrowingRateMap, collateralTokenConfig],
  );
  const selectedCollateralTokenProtocolCap = useMemo(
    () => getDecimalFromTokenMap(collateralProtocolCapMap, selectedCollateralToken),
    [collateralProtocolCapMap, selectedCollateralToken],
  );
  const selectedCollateralTokenPositionCap = useMemo(
    () => getDecimalFromTokenMap(collateralPositionCapMap, selectedCollateralToken),
    [collateralPositionCapMap, selectedCollateralToken],
  );

  const debtTokenWithFeeValues = useMemo(() => {
    if (!selectedCollateralBorrowRate) {
      return getTokenValues(null, tokenPriceMap[R_TOKEN], R_TOKEN);
    }

    return getTokenValues(
      borrowAmountDecimal.mul(Decimal.ONE.add(selectedCollateralBorrowRate)),
      tokenPriceMap[R_TOKEN],
      R_TOKEN,
    );
  }, [borrowAmountDecimal, selectedCollateralBorrowRate, tokenPriceMap]);

  const selectedCollateralTokenBalanceValues = useMemo(
    () =>
      getTokenValues(
        tokenBalanceMap[selectedCollateralToken],
        tokenPriceMap[selectedCollateralToken],
        selectedCollateralToken,
      ),
    [selectedCollateralToken, tokenBalanceMap, tokenPriceMap],
  );
  const borrowingFeeAmount = useMemo(() => {
    if (!selectedCollateralBorrowRate) {
      return null;
    }

    return Decimal.parse(borrowAmount, 0).mul(selectedCollateralBorrowRate);
  }, [borrowAmount, selectedCollateralBorrowRate]);

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

  // when selectedCollateralToken changed, change the token config as well
  useEffect(() => {
    setCollateralTokenForConfig(selectedCollateralToken);
  }, [selectedCollateralToken, setCollateralTokenForConfig]);

  useEffect(() => {
    requestManagePositionStep?.({
      underlyingCollateralToken: TOKEN_TO_UNDERLYING_TOKEN_MAP[selectedCollateralToken],
      collateralToken: selectedCollateralToken,
      collateralChange: collateralAmountDecimal,
      debtChange: borrowAmountDecimal,
    });
  }, [borrowAmountDecimal, collateralAmountDecimal, requestManagePositionStep, selectedCollateralToken]);

  /**
   * Fill in collateral and debt input fields automatically if they are empty.
   * Debt is set to 3k (minimum) and collateral is set to that collateral ratio is around 220% or a bit more.
   */
  useEffect(() => {
    if (!hasChanged) {
      const collateralBalance = tokenBalanceMap[selectedCollateralToken];
      const collateralPrice = tokenPriceMap[selectedCollateralToken];
      const rTokenPrice = tokenPriceMap[R_TOKEN];

      if (!collateralPrice || collateralPrice.isZero() || !rTokenPrice || !selectedCollateralBorrowRate) {
        return;
      }

      // Borrow amount is always set to min amount
      const borrowAmount = new Decimal(MIN_BORROW_AMOUNT);
      const borrowAmountValue = rTokenPrice.mul(borrowAmount);

      // Calculate minimum collateral amount so that resulting collateral ratio is at least 220%
      const collateralAmount = borrowAmountValue
        .mul(selectedCollateralBorrowRate.add(1))
        .mul(HEALTHY_RATIO + HEALTHY_RATIO_BUFFER)
        .div(collateralPrice);

      // TODO - Add ceil() function to decimal library
      const truncatedCollateral = new Decimal(collateralAmount.toTruncated(COLLATERAL_TOKEN_UI_PRECISION));
      const collateralAmountCeiled = truncatedCollateral.lt(collateralAmount)
        ? truncatedCollateral.add(`${'0.'.padEnd(COLLATERAL_TOKEN_UI_PRECISION + 1, '0')}1`)
        : truncatedCollateral;

      // Only fill in calculated values if user has enough collateral
      if (collateralBalance && collateralBalance.gte(collateralAmountCeiled)) {
        setCollateralAmount(collateralAmountCeiled.toString());
        setBorrowAmount(borrowAmount.toString());
        // If wallet is connected and user does not have enough collateral, rest inputs to empty state
      } else if (wallet) {
        setCollateralAmount('');
        setBorrowAmount('');
      }
      // If wallet is not connected just set input values to calculated ones without checking balance
      else if (!wallet) {
        setCollateralAmount(collateralAmountCeiled.toString());
        setBorrowAmount(borrowAmount.toString());
      }
    }
  }, [
    borrowingFeeAmount,
    selectedCollateralBorrowRate,
    hasChanged,
    selectedCollateralToken,
    selectedCollateralTokenBalanceValues.amount,
    selectedCollateralTokenBalanceValues.price,
    tokenBalanceMap,
    tokenPriceMap,
    wallet,
  ]);

  /**
   * Deposit amount of collateral converted to display collateral token
   */
  const displayCollateralTokenAmount = useMemo(() => {
    if (!selectedCollateralTokenInputValues.amount) {
      return Decimal.ZERO;
    }

    // if selected collateral token = display token, return as it as
    if (isDisplayBaseToken(selectedCollateralToken)) {
      return selectedCollateralTokenInputValues.amount;
    }

    const displayBaseToken = TOKEN_TO_DISPLAY_BASE_TOKEN_MAP[selectedCollateralToken];
    const selectedCollateralTokenConversionRate = collateralConversionRateMap?.[selectedCollateralToken];
    const displayBaseTokenConversionRate = collateralConversionRateMap?.[displayBaseToken];

    // if conversion rate not available or zero, return null
    if (
      !selectedCollateralTokenConversionRate ||
      !displayBaseTokenConversionRate ||
      selectedCollateralTokenConversionRate.isZero()
    ) {
      return null;
    }

    // display token amount = input amount * display token rate / selected token rate
    return selectedCollateralTokenInputValues.amount
      .mul(displayBaseTokenConversionRate)
      .div(selectedCollateralTokenConversionRate);
  }, [selectedCollateralTokenInputValues.amount, selectedCollateralToken, collateralConversionRateMap]);

  const collateralizationRatio = useMemo(() => {
    if (
      selectedCollateralTokenInputValues.value === null ||
      debtTokenWithFeeValues.value === null ||
      debtTokenWithFeeValues.value.isZero()
    ) {
      return null;
    }

    if (borrowAmountDecimal.lt(MIN_BORROW_AMOUNT)) {
      return null;
    }

    return selectedCollateralTokenInputValues.value.div(debtTokenWithFeeValues.value);
  }, [borrowAmountDecimal, debtTokenWithFeeValues.value, selectedCollateralTokenInputValues.value]);

  const collateralAmountWithEllipse = useMemo(() => {
    if (!selectedCollateralTokenInputValues.amount) {
      return null;
    }

    const original = selectedCollateralTokenInputValues.amount.toString();
    const truncated = selectedCollateralTokenInputValues.amount.toTruncated(INPUT_PREVIEW_DIGITS);

    return original === truncated ? original : `${truncated}...`;
  }, [selectedCollateralTokenInputValues.amount]);
  const borrowAmountWithEllipse = useMemo(() => {
    const original = borrowAmountDecimal.toString();
    const truncated = borrowAmountDecimal.toTruncated(INPUT_PREVIEW_DIGITS);

    return original === truncated ? original : `${truncated}...`;
  }, [borrowAmountDecimal]);

  const rTokenBalance = useMemo(() => tokenBalanceMap[R_TOKEN], [tokenBalanceMap]);
  const rTokenBalanceFormatted = useMemo(
    () =>
      formatCurrency(rTokenBalance, { currency: R_TOKEN, fractionDigits: R_TOKEN_UI_PRECISION, lessThanFormat: true }),
    [rTokenBalance],
  );

  const collateralSupply: Nullable<Decimal> = useMemo(
    () => protocolStats?.collateralSupply[selectedUnderlyingCollateralToken] ?? null,
    [protocolStats?.collateralSupply, selectedUnderlyingCollateralToken],
  );

  const walletConnected = useMemo(() => Boolean(wallet), [wallet]);

  const hasInputFilled = useMemo(
    () => selectedCollateralTokenInputValues.amount && borrowAmount,
    [borrowAmount, selectedCollateralTokenInputValues.amount],
  );
  const hasNonEmptyInput = useMemo(
    () => !collateralAmountDecimal.isZero() || !borrowAmountDecimal.isZero(),
    [borrowAmountDecimal, collateralAmountDecimal],
  );
  const hasEnoughCollateralTokenBalance = useMemo(
    () =>
      !walletConnected ||
      !selectedCollateralTokenInputValues.amount ||
      Boolean(
        selectedCollateralTokenBalanceValues.amount &&
          selectedCollateralTokenInputValues.amount.lte(selectedCollateralTokenBalanceValues.amount),
      ),
    [selectedCollateralTokenInputValues.amount, selectedCollateralTokenBalanceValues, walletConnected],
  );
  const hasMinBorrow = useMemo(
    () => !borrowAmount || borrowAmountDecimal.gte(MIN_BORROW_AMOUNT),
    [borrowAmount, borrowAmountDecimal],
  );
  const hasMinRatio = useMemo(
    () =>
      !collateralizationRatio || collateralizationRatio.gte(MIN_COLLATERAL_RATIO[selectedUnderlyingCollateralToken]),
    [collateralizationRatio, selectedUnderlyingCollateralToken],
  );

  const isPositionWithinCollateralPositionCap = useMemo(() => {
    if (!collateralSupply || !selectedCollateralTokenPositionCap) {
      return false;
    }

    // TODO: assume 1:1 of the token rate here, should calculate the conversion rate
    return collateralAmountDecimal.lte(selectedCollateralTokenPositionCap);
  }, [collateralAmountDecimal, collateralSupply, selectedCollateralTokenPositionCap]);

  const isPositionWithinCollateralProtocolCap = useMemo(() => {
    if (!collateralSupply || !selectedCollateralTokenProtocolCap) {
      return false;
    }

    // TODO: assume 1:1 of the token rate here, should calculate the conversion rate
    return collateralAmountDecimal.add(collateralSupply).lte(selectedCollateralTokenProtocolCap);
  }, [collateralAmountDecimal, collateralSupply, selectedCollateralTokenProtocolCap]);

  const isTotalSupplyWithinCollateralProtocolCap = useMemo(() => {
    if (!collateralSupply || !selectedCollateralTokenProtocolCap) {
      return false;
    }

    return collateralSupply.lte(selectedCollateralTokenProtocolCap);
  }, [collateralSupply, selectedCollateralTokenProtocolCap]);

  const isPositionWithinDebtPositionCap = useMemo(() => {
    // only wstETH group has this requirement
    if (selectedUnderlyingCollateralToken === 'wstETH') {
      const totalDebtSupply = protocolStats?.debtSupply.wstETH;

      if (!totalDebtSupply) {
        return false;
      }

      const maxBorrowAmount = totalDebtSupply.div(10);
      return borrowAmountDecimal.lte(maxBorrowAmount);
    }

    return true;
  }, [borrowAmountDecimal, protocolStats?.debtSupply.wstETH, selectedUnderlyingCollateralToken]);

  const errPositionOutOfCollateralPositionCap = useMemo(
    () => !isPositionWithinCollateralPositionCap && Boolean(selectedCollateralTokenPositionCap),
    [isPositionWithinCollateralPositionCap, selectedCollateralTokenPositionCap],
  );
  const errPositionOutOfCollateralProtocolCap = useMemo(
    () => !isPositionWithinCollateralProtocolCap && Boolean(selectedCollateralTokenProtocolCap),
    [isPositionWithinCollateralProtocolCap, selectedCollateralTokenProtocolCap],
  );

  const canBorrow = useMemo(
    () =>
      Boolean(
        hasInputFilled &&
          hasEnoughCollateralTokenBalance &&
          hasMinBorrow &&
          hasMinRatio &&
          isPositionWithinCollateralPositionCap &&
          isPositionWithinCollateralProtocolCap &&
          isTotalSupplyWithinCollateralProtocolCap &&
          isPositionWithinDebtPositionCap &&
          !isWrongNetwork,
      ),
    [
      hasInputFilled,
      hasEnoughCollateralTokenBalance,
      hasMinBorrow,
      hasMinRatio,
      isPositionWithinCollateralPositionCap,
      isPositionWithinCollateralProtocolCap,
      isTotalSupplyWithinCollateralProtocolCap,
      isPositionWithinDebtPositionCap,
      isWrongNetwork,
    ],
  );

  const collateralErrorMsg = useMemo(() => {
    if (!hasEnoughCollateralTokenBalance) {
      return 'Insufficient funds';
    }

    if (errPositionOutOfCollateralPositionCap) {
      const collateralPositionCapFormatted = formatCurrency(selectedCollateralTokenPositionCap, {
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
  }, [
    errPositionOutOfCollateralPositionCap,
    errPositionOutOfCollateralProtocolCap,
    hasEnoughCollateralTokenBalance,
    selectedCollateralToken,
    selectedCollateralTokenPositionCap,
  ]);

  const debtErrorMsg = useMemo(() => {
    if (!hasMinBorrow) {
      const minBorrowFormatted = formatDecimal(MIN_BORROW_AMOUNT, 0);
      return `You need to generate at least ${minBorrowFormatted} R`;
    }

    if (!hasMinRatio) {
      return 'Collateralization ratio is below the minimum threshold';
    }

    if (!isPositionWithinDebtPositionCap) {
      return 'Amount exceeds maximum debt allowed per Position';
    }
  }, [hasMinBorrow, hasMinRatio, isPositionWithinDebtPositionCap]);

  const buttonLabel = useMemo(() => {
    if (!walletConnected) {
      return 'Connect wallet';
    }

    if (!isTotalSupplyWithinCollateralProtocolCap && !managePositionStatus.pending) {
      const collateralProtocolCapFormatted = formatCurrency(collateralProtocolCapMap[selectedCollateralToken], {
        currency: selectedCollateralToken,
        fractionDigits: 0,
      });
      return `Protocol collateral cap of ${collateralProtocolCapFormatted} reached. Please check again later.`;
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
    walletConnected,
    isTotalSupplyWithinCollateralProtocolCap,
    managePositionStatus.pending,
    executionSteps,
    executionType,
    hasNonEmptyInput,
    collateralProtocolCapMap,
    selectedCollateralToken,
    currentExecutionSteps,
    tokenNeedsToBeApproved,
  ]);

  const onConnectWallet = useCallback(() => {
    connect();
  }, [connect]);

  const onAction = useCallback(() => {
    if (!canBorrow) {
      return;
    }

    managePosition?.();
  }, [canBorrow, managePosition]);

  const handleCollateralTokenChange = useCallback((token: string) => {
    if (isCollateralToken(token)) {
      setMaxButtonDisabled(false);
      setSelectedCollateralToken(token);
      setHasChanged(true);
    }
  }, []);

  const handleCollateralTokenBlur = useCallback(() => {
    // if borrow input is not empty, do nth
    if (borrowAmount) {
      return;
    }

    // if borrow input is null, borrowTokenValues.price will be null, so use the price map here
    const borrowTokenPrice = tokenPriceMap[R_TOKEN];

    if (!selectedCollateralTokenInputValues.value || !borrowTokenPrice || borrowTokenPrice.isZero() || !HEALTHY_RATIO) {
      return;
    }

    const defaultBorrowAmount = selectedCollateralTokenInputValues.value
      .div(borrowTokenPrice)
      .div(HEALTHY_RATIO + HEALTHY_RATIO_BUFFER)
      .toString();
    setBorrowAmount(defaultBorrowAmount);
    setHasChanged(true);
  }, [borrowAmount, selectedCollateralTokenInputValues.value, tokenPriceMap]);

  const handleBorrowTokenBlur = useCallback(() => {
    // if collateral input is not empty, do nth
    if (selectedCollateralTokenInputValues.amount) {
      return;
    }

    // if collateral input is null, collateralTokenValues.price will be null, so use the price map here
    const collateralTokenPrice = tokenPriceMap[selectedCollateralToken];

    if (!debtTokenWithFeeValues.value || !collateralTokenPrice || collateralTokenPrice.isZero()) {
      return;
    }

    const defaultCollateralAmount = debtTokenWithFeeValues.value
      .mul(HEALTHY_RATIO + HEALTHY_RATIO_BUFFER)
      .div(collateralTokenPrice)
      .toString();
    setCollateralAmount(defaultCollateralAmount);
    setHasChanged(true);
  }, [debtTokenWithFeeValues.value, selectedCollateralTokenInputValues.amount, selectedCollateralToken, tokenPriceMap]);

  /**
   * Update action button state based on current approve/borrow request status
   */
  useEffect(() => {
    if (
      managePositionStatus.pending ||
      managePositionStepsStatus.pending ||
      (walletConnected && hasNonEmptyInput && !executionType)
    ) {
      setActionButtonState('loading');
    } else if (managePositionStatus.success) {
      setActionButtonState('success');
    } else {
      setActionButtonState('default');
    }
  }, [
    executionType,
    hasInputFilled,
    hasNonEmptyInput,
    managePositionStatus.pending,
    managePositionStatus.success,
    managePositionStepsStatus.pending,
    walletConnected,
  ]);

  const borrowingFeePercentageFormatted = useMemo(
    () => (selectedCollateralBorrowRate?.isZero() ? 'Free' : formatPercentage(selectedCollateralBorrowRate)),
    [selectedCollateralBorrowRate],
  );

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

    if (borrowingFeeAmount.gte(0.01)) {
      return `~${borrowingFeeAmountFormatted}`;
    } else {
      return borrowingFeeAmountFormatted;
    }
  }, [borrowingFeeAmount]);

  const handleMaxButtonClick = useCallback(() => {
    if (
      selectedCollateralTokenBalanceValues.amount &&
      selectedCollateralTokenBalanceValues.value &&
      selectedCollateralTokenBalanceValues.amount.gt(0)
    ) {
      setMaxButtonDisabled(true);
      setCollateralAmount(selectedCollateralTokenBalanceValues.amount.toString());
      setHasChanged(true);

      const borrowTokenPrice = tokenPriceMap[R_TOKEN];

      if (borrowTokenPrice && !borrowTokenPrice.isZero()) {
        const defaultBorrowAmount = selectedCollateralTokenBalanceValues.value
          .div(borrowTokenPrice)
          .div(HEALTHY_RATIO + HEALTHY_RATIO_BUFFER)
          .toTruncated(2);
        setBorrowAmount(defaultBorrowAmount);
        setHasChanged(true);
      }
    }
  }, [selectedCollateralTokenBalanceValues, tokenPriceMap]);

  const handleCollateralValueUpdate = useCallback((amount: string) => {
    setMaxButtonDisabled(false);
    setCollateralAmount(amount);
    setHasChanged(true);
  }, []);

  const handleBorrowValueUpdate = useCallback((amount: string) => {
    setMaxButtonDisabled(false);
    setBorrowAmount(amount);
    setHasChanged(true);
  }, []);

  return (
    <div className="raft__openPosition">
      <div className="raft__openPosition__header">
        <Typography variant="heading2">Open Position</Typography>
        {walletConnected && (
          <Button
            variant="secondary"
            text="Auto safe borrow"
            disabled={maxButtonDisabled}
            onClick={handleMaxButtonClick}
          />
        )}
      </div>
      <div className="raft__openPosition__input">
        <CurrencyInput
          label="YOU DEPOSIT"
          precision={18}
          selectedToken={selectedCollateralToken}
          tokens={[...SUPPORTED_COLLATERAL_TOKENS]}
          value={collateralAmount}
          previewValue={collateralAmountWithEllipse ?? undefined}
          maxAmount={selectedCollateralTokenBalanceValues.amount}
          maxAmountFormatted={selectedCollateralTokenBalanceValues.amountFormatted ?? undefined}
          onTokenUpdate={handleCollateralTokenChange}
          onValueUpdate={handleCollateralValueUpdate}
          onBlur={handleCollateralTokenBlur}
          error={
            !hasEnoughCollateralTokenBalance ||
            !hasMinRatio ||
            errPositionOutOfCollateralPositionCap ||
            errPositionOutOfCollateralProtocolCap
          }
          errorMsg={collateralErrorMsg}
        />
        <CurrencyInput
          label="YOU GENERATE"
          precision={18}
          selectedToken={R_TOKEN}
          tokens={[R_TOKEN]}
          value={borrowAmount}
          previewValue={borrowAmountWithEllipse ?? undefined}
          maxAmount={rTokenBalance}
          maxAmountFormatted={rTokenBalanceFormatted ?? undefined}
          onValueUpdate={handleBorrowValueUpdate}
          onBlur={handleBorrowTokenBlur}
          error={!hasMinBorrow || !hasMinRatio || !isPositionWithinDebtPositionCap}
          errorMsg={debtErrorMsg}
        />
      </div>
      <PositionAfter
        displayCollateralToken={TOKEN_TO_DISPLAY_BASE_TOKEN_MAP[selectedCollateralToken]}
        displayCollateralTokenAmount={displayCollateralTokenAmount}
        collateralTokenValueFormatted={selectedCollateralTokenInputValues.valueFormatted}
        borrowTokenAmountFormatted={debtTokenWithFeeValues.amountFormatted}
        collateralizationRatio={collateralizationRatio}
        borrowingFeePercentageFormatted={borrowingFeePercentageFormatted}
        borrowingFeeAmountFormatted={borrowingFeeAmountFormatted}
      />
      <PositionAction
        actionButtonState={actionButtonState}
        canBorrow={canBorrow}
        buttonLabel={buttonLabel}
        walletConnected={walletConnected}
        onClick={walletConnected ? onAction : onConnectWallet}
      />
    </div>
  );
};
export default OpenPosition;
