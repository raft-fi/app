import { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import { MIN_COLLATERAL_RATIO, R_TOKEN } from '@raft-fi/sdk';
import { useConnectWallet } from '@web3-onboard/react';
import { Link } from 'react-router-dom';
import { Link as ExternalLink } from 'tempus-ui';
import { Decimal } from '@tempusfinance/decimal';
import { CurrencyInput, Icon, SliderInput, Typography, InfoBox } from '../shared';
import {
  DEBOUNCE_IN_MS,
  INPUT_PREVIEW_DIGITS,
  MIN_BORROW_AMOUNT,
  SUPPORTED_COLLATERAL_TOKENS,
  SUPPORTED_COLLATERAL_TOKEN_SETTINGS,
  TOKEN_TO_UNDERLYING_TOKEN_MAP,
} from '../../constants';
import { formatCurrency, getDecimalFromTokenMap, getTokenValues, isCollateralToken } from '../../utils';
import {
  useCollateralPositionCaps,
  useCollateralProtocolCaps,
  useNetwork,
  useProtocolStats,
  useTokenBalances,
  useTokenPrices,
  useWallet,
  useLeverage,
  useCollateralTokenAprs,
  useSettingOptions,
  useEstimateSwapPrice,
  useRFlashMintFee,
  useCollateralBorrowingRates,
} from '../../hooks';
import { Nullable, SupportedCollateralToken } from '../../interfaces';
import { LeveragePositionAction, LeveragePositionAfter } from '../LeveragePosition';
import Settings from '../Settings';

import './OpenLeveragePosition.scss';

const MIN_LEVERAGE = 1;
const MAX_LEVERAGE = 6;

const OpenLeveragePosition = () => {
  const [, connect] = useConnectWallet();
  const { isWrongNetwork } = useNetwork();
  const wallet = useWallet();

  const protocolStats = useProtocolStats();
  const tokenPriceMap = useTokenPrices();
  const tokenBalanceMap = useTokenBalances();
  const borrowingRateMap = useCollateralBorrowingRates();
  const collateralPositionCapMap = useCollateralPositionCaps();
  const collateralProtocolCapMap = useCollateralProtocolCaps();
  const collateralTokenAprMap = useCollateralTokenAprs();
  const flashMintFee = useRFlashMintFee();
  const [{ router, slippage }] = useSettingOptions();
  const { leveragePositionStatus, leveragePosition, leveragePositionStepsStatus, requestLeveragePositionStep } =
    useLeverage();
  const { swapPriceStatus, estimateSwapPrice } = useEstimateSwapPrice();

  const [collateralAmount, setCollateralAmount] = useState<string>('');
  const [selectedCollateralToken, setSelectedCollateralToken] = useState<SupportedCollateralToken>(
    SUPPORTED_COLLATERAL_TOKENS[0],
  );
  const [leverage, setLeverage] = useState<number>(MIN_LEVERAGE);
  const [actionButtonState, setActionButtonState] = useState<string>('default');
  const swapPriceTime = useRef<NodeJS.Timeout>();

  const selectedUnderlyingCollateralToken = useMemo(
    () => TOKEN_TO_UNDERLYING_TOKEN_MAP[selectedCollateralToken],
    [selectedCollateralToken],
  );
  const collateralAmountDecimal = useMemo(() => Decimal.parse(collateralAmount, 0), [collateralAmount]);
  const collateralSupply: Nullable<Decimal> = useMemo(
    () => protocolStats?.collateralSupply[selectedUnderlyingCollateralToken] ?? null,
    [protocolStats?.collateralSupply, selectedUnderlyingCollateralToken],
  );

  const selectedCollateralTokenInputValues = useMemo(
    () => getTokenValues(collateralAmount, tokenPriceMap[selectedCollateralToken], selectedCollateralToken),
    [collateralAmount, selectedCollateralToken, tokenPriceMap],
  );
  const selectedCollateralTokenBalanceValues = useMemo(
    () =>
      getTokenValues(
        tokenBalanceMap[selectedCollateralToken],
        tokenPriceMap[selectedCollateralToken],
        selectedCollateralToken,
      ),
    [selectedCollateralToken, tokenBalanceMap, tokenPriceMap],
  );

  /**
   * Collateralization ratio calculated based on the input principal collateral amount
   * and the amount of debt that will be created with current leverage.
   */
  const collateralizationRatio = useMemo(() => {
    const inputCollateralValue = selectedCollateralTokenInputValues.value;
    if (!inputCollateralValue) {
      return Decimal.MAX_DECIMAL;
    }

    const debtValue = inputCollateralValue.mul(leverage - 1);
    const leveragedCollateralValue = debtValue.mul(Decimal.ONE.sub(slippage));
    const collateralValue = inputCollateralValue.add(leveragedCollateralValue);

    return collateralValue.div(debtValue);
  }, [leverage, selectedCollateralTokenInputValues.value, slippage]);

  const selectedCollateralTokenPrice = useMemo(
    () => getDecimalFromTokenMap(tokenPriceMap, selectedCollateralToken),
    [selectedCollateralToken, tokenPriceMap],
  );
  const selectedUnderlyingCollateralTokenPrice = useMemo(
    () => getDecimalFromTokenMap(tokenPriceMap, selectedUnderlyingCollateralToken),
    [selectedUnderlyingCollateralToken, tokenPriceMap],
  );
  const selectedCollateralTokenLeveragedApr = useMemo(() => {
    const apr = getDecimalFromTokenMap(collateralTokenAprMap, selectedCollateralToken);

    if (!apr) {
      return null;
    }

    return apr.mul(leverage);
  }, [collateralTokenAprMap, leverage, selectedCollateralToken]);
  const selectedCollateralTokenProtocolCap = useMemo(
    () => getDecimalFromTokenMap(collateralProtocolCapMap, selectedCollateralToken),
    [collateralProtocolCapMap, selectedCollateralToken],
  );
  const selectedCollateralTokenPositionCap = useMemo(
    () => getDecimalFromTokenMap(collateralPositionCapMap, selectedCollateralToken),
    [collateralPositionCapMap, selectedCollateralToken],
  );

  const liquidationPrice = useMemo(() => {
    if (!selectedCollateralTokenPrice || collateralizationRatio.equals(Decimal.MAX_DECIMAL)) {
      return null;
    }

    return selectedCollateralTokenPrice
      .div(collateralizationRatio)
      .mul(MIN_COLLATERAL_RATIO[selectedUnderlyingCollateralToken]);
  }, [collateralizationRatio, selectedCollateralTokenPrice, selectedUnderlyingCollateralToken]);

  const liquidationPriceDropPercent = useMemo(() => {
    if (!liquidationPrice || !selectedCollateralTokenPrice) {
      return null;
    }

    return Decimal.max(selectedCollateralTokenPrice.sub(liquidationPrice).div(selectedCollateralTokenPrice), 0);
  }, [liquidationPrice, selectedCollateralTokenPrice]);

  const minDepositAmount = useMemo(() => {
    if (leverage <= 1) {
      return Decimal.MAX_DECIMAL;
    }

    if (!selectedCollateralTokenPrice || selectedCollateralTokenPrice.isZero()) {
      return Decimal.MAX_DECIMAL;
    }

    return new Decimal(MIN_BORROW_AMOUNT).div(selectedCollateralTokenPrice.mul(leverage - 1));
  }, [leverage, selectedCollateralTokenPrice]);
  const totalFee = useMemo(() => {
    if (leverage <= 1) {
      return null;
    }

    if (!selectedUnderlyingCollateralTokenPrice || selectedUnderlyingCollateralTokenPrice.isZero()) {
      return null;
    }

    const effectiveFlashMintFee = flashMintFee ?? Decimal.ZERO;

    const borrowingFee = getDecimalFromTokenMap(borrowingRateMap, selectedUnderlyingCollateralToken) ?? Decimal.ZERO;

    let priceImpact: Decimal;

    if (swapPriceStatus.pending || swapPriceStatus.error || !swapPriceStatus.result) {
      priceImpact = Decimal.ZERO;
    } else {
      // swap price result = R/wstETH
      const swapPrice = Decimal.ONE.div(swapPriceStatus.result);
      priceImpact = swapPrice.div(selectedUnderlyingCollateralTokenPrice).sub(1).abs();
    }

    // total fee = (1 + swap impact) * (1 + borrwing fee) * (1 + flash mint fee) - 1
    return priceImpact.add(1).mul(borrowingFee.add(1)).mul(effectiveFlashMintFee.add(1)).sub(1);
  }, [
    borrowingRateMap,
    flashMintFee,
    leverage,
    selectedUnderlyingCollateralToken,
    selectedUnderlyingCollateralTokenPrice,
    swapPriceStatus.error,
    swapPriceStatus.pending,
    swapPriceStatus.result,
  ]);

  const collateralAmountWithEllipse = useMemo(() => {
    if (!selectedCollateralTokenInputValues.amount) {
      return null;
    }

    const original = selectedCollateralTokenInputValues.amount.toString();
    const truncated = selectedCollateralTokenInputValues.amount.toTruncated(INPUT_PREVIEW_DIGITS);

    return original === truncated ? original : `${truncated}...`;
  }, [selectedCollateralTokenInputValues.amount]);

  const executionSteps = useMemo(
    () => leveragePositionStepsStatus.result?.numberOfSteps,
    [leveragePositionStepsStatus.result?.numberOfSteps],
  );
  const currentExecutionSteps = useMemo(
    () => leveragePositionStepsStatus.result?.stepNumber,
    [leveragePositionStepsStatus.result?.stepNumber],
  );
  const executionType = useMemo(
    () => leveragePositionStepsStatus.result?.type?.name ?? null,
    [leveragePositionStepsStatus.result?.type],
  );
  const tokenNeedsToBeApproved = useMemo(
    () =>
      executionType && ['approve', 'permit'].includes(executionType)
        ? leveragePositionStepsStatus.result?.type?.token ?? null
        : null,
    [executionType, leveragePositionStepsStatus.result?.type?.token],
  );

  const isPositionWithinCollateralPositionCap = useMemo(() => {
    if (selectedCollateralTokenPositionCap?.equals(Decimal.MAX_DECIMAL)) {
      return true;
    }

    if (!collateralSupply || !selectedCollateralTokenPositionCap) {
      return false;
    }

    // TODO: assume 1:1 of the token rate here, should calculate the conversion rate
    return collateralAmountDecimal.lte(selectedCollateralTokenPositionCap);
  }, [collateralAmountDecimal, collateralSupply, selectedCollateralTokenPositionCap]);

  const isPositionWithinCollateralProtocolCap = useMemo(() => {
    if (selectedCollateralTokenProtocolCap?.equals(Decimal.MAX_DECIMAL)) {
      return true;
    }

    if (!collateralSupply || !selectedCollateralTokenProtocolCap) {
      return false;
    }

    // TODO: assume 1:1 of the token rate here, should calculate the conversion rate
    return collateralAmountDecimal.add(collateralSupply).lte(selectedCollateralTokenProtocolCap);
  }, [collateralAmountDecimal, collateralSupply, selectedCollateralTokenProtocolCap]);

  const isTotalSupplyWithinCollateralProtocolCap = useMemo(() => {
    const selectedCollateralTokenProtocolCap = getDecimalFromTokenMap(
      collateralProtocolCapMap,
      selectedCollateralToken,
    );

    if (selectedCollateralTokenProtocolCap?.equals(Decimal.MAX_DECIMAL)) {
      return true;
    }

    if (!collateralSupply || !selectedCollateralTokenProtocolCap) {
      return false;
    }

    return collateralSupply.lte(selectedCollateralTokenProtocolCap);
  }, [collateralProtocolCapMap, collateralSupply, selectedCollateralToken]);

  const walletConnected = useMemo(() => Boolean(wallet), [wallet]);
  const hasLeveraged = useMemo(() => leverage > 1, [leverage]);

  /**
   * Checks if both input fields (collateral and leverage) are non-empty
   */
  const hasNonEmptyInput = useMemo(
    () => !collateralAmountDecimal.isZero() && hasLeveraged,
    [collateralAmountDecimal, hasLeveraged],
  );

  const hasMinDeposit = useMemo(
    () => collateralAmountDecimal.gte(minDepositAmount),
    [collateralAmountDecimal, minDepositAmount],
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
  const errTxn = useMemo(() => leveragePositionStepsStatus.error, [leveragePositionStepsStatus.error]);
  const errPositionOutOfCollateralPositionCap = useMemo(
    () => !isPositionWithinCollateralPositionCap && Boolean(selectedCollateralTokenPositionCap),
    [isPositionWithinCollateralPositionCap, selectedCollateralTokenPositionCap],
  );
  const errPositionOutOfCollateralProtocolCap = useMemo(
    () => !isPositionWithinCollateralProtocolCap && Boolean(selectedCollateralTokenProtocolCap),
    [isPositionWithinCollateralProtocolCap, selectedCollateralTokenProtocolCap],
  );

  const canLeverage = useMemo(
    () =>
      Boolean(
        hasLeveraged &&
          hasMinDeposit &&
          hasNonEmptyInput &&
          hasEnoughCollateralTokenBalance &&
          isPositionWithinCollateralPositionCap &&
          isPositionWithinCollateralProtocolCap &&
          isTotalSupplyWithinCollateralProtocolCap &&
          !errTxn &&
          !isWrongNetwork,
      ),
    [
      errTxn,
      hasEnoughCollateralTokenBalance,
      hasLeveraged,
      hasMinDeposit,
      hasNonEmptyInput,
      isPositionWithinCollateralPositionCap,
      isPositionWithinCollateralProtocolCap,
      isTotalSupplyWithinCollateralProtocolCap,
      isWrongNetwork,
    ],
  );

  const collateralErrorMsg = useMemo(() => {
    if (!hasEnoughCollateralTokenBalance) {
      return 'Insufficient funds';
    }

    if (!hasMinDeposit && hasNonEmptyInput) {
      return 'Insufficient collateral deposit for leverage position. Please increase to get started.';
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
    hasMinDeposit,
    hasNonEmptyInput,
    selectedCollateralToken,
    selectedCollateralTokenPositionCap,
  ]);

  const buttonLabel = useMemo(() => {
    if (!walletConnected) {
      return 'Connect wallet';
    }

    if (leveragePositionStepsStatus.error?.message) {
      return leveragePositionStepsStatus.error.message;
    }

    if (!isTotalSupplyWithinCollateralProtocolCap && !leveragePositionStatus.pending) {
      const collateralProtocolCapFormatted = formatCurrency(collateralProtocolCapMap[selectedCollateralToken], {
        currency: selectedCollateralToken,
        fractionDigits: 0,
      });
      return `Protocol collateral cap of ${collateralProtocolCapFormatted} reached. Please check again later.`;
    }

    if (executionSteps === 1) {
      return leveragePositionStatus.pending ? 'Executing' : 'Execute';
    }

    if (executionType === 'whitelist') {
      return leveragePositionStatus.pending
        ? `Whitelisting ${selectedCollateralToken} (${currentExecutionSteps}/${executionSteps})`
        : `Whitelist ${selectedCollateralToken} (${currentExecutionSteps}/${executionSteps})`;
    }

    if (executionType === 'approve' || executionType === 'permit') {
      return leveragePositionStatus.pending
        ? `Approving ${tokenNeedsToBeApproved} (${currentExecutionSteps}/${executionSteps})`
        : `Approve ${tokenNeedsToBeApproved} (${currentExecutionSteps}/${executionSteps})`;
    }

    if (executionType === 'leverage') {
      return leveragePositionStatus.pending
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
    leveragePositionStepsStatus.error?.message,
    isTotalSupplyWithinCollateralProtocolCap,
    leveragePositionStatus.pending,
    executionSteps,
    executionType,
    hasNonEmptyInput,
    collateralProtocolCapMap,
    selectedCollateralToken,
    currentExecutionSteps,
    tokenNeedsToBeApproved,
  ]);

  const onLeverageChange = useCallback((value: number) => setLeverage(value), []);
  const handleCollateralValueUpdate = useCallback((amount: string) => setCollateralAmount(amount), []);
  const handleCollateralTokenChange = useCallback((token: string) => {
    if (isCollateralToken(token)) {
      setSelectedCollateralToken(token);
    }
  }, []);

  const onConnectWallet = useCallback(() => {
    connect();
  }, [connect]);

  const onAction = useCallback(() => {
    if (!canLeverage) {
      return;
    }

    leveragePosition?.();
  }, [canLeverage, leveragePosition]);

  /**
   * Update action button state based on current approve/borrow request status
   */
  useEffect(() => {
    if (
      leveragePositionStatus.pending ||
      leveragePositionStepsStatus.pending ||
      (walletConnected &&
        !collateralAmountDecimal.isZero() &&
        !executionType &&
        !leveragePositionStatus.error &&
        !leveragePositionStepsStatus.error)
    ) {
      setActionButtonState('loading');
    } else if (leveragePositionStatus.success) {
      setActionButtonState('success');
    } else {
      setActionButtonState('default');
    }
  }, [
    collateralAmountDecimal,
    executionType,
    leveragePositionStatus,
    leveragePositionStatus.pending,
    leveragePositionStatus.success,
    leveragePositionStepsStatus.error,
    leveragePositionStepsStatus.pending,
    walletConnected,
  ]);

  /**
   * Every time input changes, request leverage position steps. In case one of this input fields is empty,
   * skip the request.
   */
  useEffect(() => {
    if (!hasNonEmptyInput) {
      return;
    }

    requestLeveragePositionStep?.({
      underlyingCollateralToken: TOKEN_TO_UNDERLYING_TOKEN_MAP[selectedCollateralToken],
      collateralToken: selectedCollateralToken,
      collateralChange: collateralAmountDecimal,
      leverage: new Decimal(leverage),
      currentPrincipalCollateral: Decimal.ZERO,
      slippage,
    });
  }, [
    collateralAmountDecimal,
    hasNonEmptyInput,
    leverage,
    requestLeveragePositionStep,
    selectedCollateralToken,
    slippage,
  ]);

  useEffect(() => {
    if (swapPriceTime.current) {
      clearTimeout(swapPriceTime.current);
    }
    swapPriceTime.current = setTimeout(() => {
      if (selectedCollateralTokenPrice && leverage > 1) {
        const amountToSwap = collateralAmountDecimal.mul(selectedCollateralTokenPrice).mul(leverage - 1);
        estimateSwapPrice({
          underlyingCollateralToken: selectedUnderlyingCollateralToken,
          amountToSwap,
          fromToken: R_TOKEN,
          toToken: SUPPORTED_COLLATERAL_TOKEN_SETTINGS[selectedUnderlyingCollateralToken].swapToken,
          router,
          slippage,
        });
      }
    }, DEBOUNCE_IN_MS);
  }, [
    collateralAmountDecimal,
    estimateSwapPrice,
    leverage,
    requestLeveragePositionStep,
    router,
    selectedCollateralToken,
    selectedCollateralTokenPrice,
    selectedUnderlyingCollateralToken,
    selectedUnderlyingCollateralTokenPrice,
    slippage,
  ]);

  return (
    <div className="raft__openLeveragePosition">
      <div className="raft__openLeveragePositionHeader">
        <div className="raft__openLeveragePositionHeaderTitle">
          <Link className="raft__openLeveragePositionHeaderBack" to="/">
            <Icon variant="arrow-left" size={12} />
          </Link>
          <Typography variant="heading2" weight="medium">
            Open Leverage Position
          </Typography>
        </div>
        <div className="raft__openLeveragePositionHeaderActions">
          <Settings />
        </div>
      </div>
      <div className="raft__openLeveragePositionInputs">
        <CurrencyInput
          label="YOU DEPOSIT"
          precision={18}
          selectedToken={selectedCollateralToken}
          tokens={['stETH', 'wstETH']} // TODO - Add support for rETH and use SUPPORTED_COLLATERAL_TOKENS constant
          value={collateralAmount}
          previewValue={collateralAmountWithEllipse ?? undefined}
          maxAmount={selectedCollateralTokenBalanceValues.amount}
          maxAmountFormatted={selectedCollateralTokenBalanceValues.amountFormatted ?? undefined}
          onTokenUpdate={handleCollateralTokenChange}
          onValueUpdate={handleCollateralValueUpdate}
          error={
            !hasEnoughCollateralTokenBalance ||
            (!hasMinDeposit && hasNonEmptyInput) ||
            errPositionOutOfCollateralPositionCap ||
            errPositionOutOfCollateralProtocolCap
          }
          errorMsg={collateralErrorMsg}
        />
        <SliderInput
          label="TARGET LEVERAGE"
          value={leverage}
          min={MIN_LEVERAGE}
          max={MAX_LEVERAGE}
          step={0.1}
          onValueChange={onLeverageChange}
        />
      </div>
      {/* TODO - Check if link inside info box is correct */}
      <InfoBox
        variant="warning"
        text={
          <div className="raft__infoBox__warningLink">
            <Typography variant="body2" color="text-warning">
              This feature flash mints R, and sources liquidity from decentralized exchanges. Read more about the risks{' '}
              <ExternalLink href="https://docs.raft.fi">here.</ExternalLink>
            </Typography>
          </div>
        }
      />
      <LeveragePositionAfter
        liquidationPrice={liquidationPrice}
        liquidationPriceChange={liquidationPriceDropPercent}
        leverageAPR={selectedCollateralTokenLeveragedApr}
        totalFee={totalFee}
        liquidationPriceLabel="LIQUIDATION PRICE"
        leverageAPRLabel="LEVERAGE APR"
      />
      <LeveragePositionAction
        actionButtonState={actionButtonState}
        canLeverage={canLeverage}
        buttonLabel={buttonLabel}
        walletConnected={walletConnected}
        onClick={walletConnected ? onAction : onConnectWallet}
      />
    </div>
  );
};
export default OpenLeveragePosition;
