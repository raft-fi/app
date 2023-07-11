import { R_TOKEN } from '@raft-fi/sdk';
import { useCallback, useState, useMemo, useEffect, FC, useRef } from 'react';
import { useConnectWallet } from '@web3-onboard/react';
import { Link } from 'react-router-dom';
import { ButtonWrapper } from 'tempus-ui';
import { Decimal } from '@tempusfinance/decimal';
import { Button, CurrencyInput, Icon, SliderInput, Typography, InfoBox } from '../shared';
import {
  DEBOUNCE_IN_MS,
  FLASH_MINT_FEE,
  INPUT_PREVIEW_DIGITS,
  MIN_BORROW_AMOUNT,
  SUPPORTED_COLLATERAL_TOKENS,
  TOKEN_TO_UNDERLYING_TOKEN_MAP,
} from '../../constants';
import {
  formatCurrency,
  getDecimalFromTokenMap,
  getTokenValues,
  isCollateralToken,
  isUnderlyingCollateralToken,
} from '../../utils';
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
  useCollateralConversionRates,
  useSettingOptions,
  useEstimateSwapPrice,
} from '../../hooks';
import { Nullable, LeveragePosition, SupportedCollateralToken } from '../../interfaces';
import { LeveragePositionAction, LeveragePositionAfter } from '../LeveragePosition';
import Settings from '../Settings';

import './AdjustLeveragePosition.scss';

const MIN_LEVERAGE = 1;
const MAX_LEVERAGE = 6;

interface AdjustPositionProps {
  position: LeveragePosition;
}

const AdjustLeveragePosition: FC<AdjustPositionProps> = ({
  position: { collateralBalance, debtBalance, effectiveLeverage, principalCollateralBalance },
}) => {
  const [, connect] = useConnectWallet();
  const { isWrongNetwork } = useNetwork();
  const wallet = useWallet();

  const protocolStats = useProtocolStats();
  const tokenPriceMap = useTokenPrices();
  const tokenBalanceMap = useTokenBalances();
  const collateralPositionCapMap = useCollateralPositionCaps();
  const collateralProtocolCapMap = useCollateralProtocolCaps();
  const collateralTokenAprMap = useCollateralTokenAprs();
  const collateralConversionRateMap = useCollateralConversionRates();
  const [{ router, slippage }] = useSettingOptions();
  const { leveragePositionStatus, leveragePosition, leveragePositionStepsStatus, requestLeveragePositionStep } =
    useLeverage();
  const { swapPriceStatus, estimateSwapPrice } = useEstimateSwapPrice();

  const defaultLeverage = Number(effectiveLeverage.toRounded(1));

  const [collateralAmount, setCollateralAmount] = useState<string>('');
  const [selectedCollateralToken, setSelectedCollateralToken] = useState<SupportedCollateralToken>(
    SUPPORTED_COLLATERAL_TOKENS[0],
  );
  const [leverage, setLeverage] = useState<number>(defaultLeverage);
  const [actionButtonState, setActionButtonState] = useState<string>('default');
  const [isAddCollateral, setIsAddCollateral] = useState<boolean>(true);
  const [closePositionActive, setClosePositionActive] = useState<boolean>(false);
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

  const collateralizationRatio = useMemo(
    () => (leverage > 1 ? new Decimal(leverage).div(leverage - 1) : Decimal.MAX_DECIMAL),
    [leverage],
  );
  const selectedCollateralTokenPrice = useMemo(
    () => getDecimalFromTokenMap(tokenPriceMap, selectedCollateralToken),
    [selectedCollateralToken, tokenPriceMap],
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

    return selectedCollateralTokenPrice.div(collateralizationRatio);
  }, [collateralizationRatio, selectedCollateralTokenPrice]);
  const liquidationPriceDropPercent = useMemo(
    () =>
      !collateralizationRatio.isZero() && !collateralizationRatio.equals(Decimal.MAX_DECIMAL)
        ? Decimal.ONE.sub(Decimal.ONE.div(collateralizationRatio)).mul(-1)
        : null,
    [collateralizationRatio],
  );

  /**
   * Collateral input amount converted to underlying token amount (e.g. stETH -> wstETH)
   * @returns {Decimal | null} Null is returned in case conversion rates are not loaded from SDK.
   */
  const underlyingCollateralAmount = useMemo(() => {
    // This rate is from underlying to collateral token (e.g. wstETH -> stETH)
    const rate = collateralConversionRateMap[selectedCollateralToken];
    if (!rate) {
      return null;
    }

    return collateralAmountDecimal.mul(Decimal.ONE.div(rate));
  }, [collateralAmountDecimal, collateralConversionRateMap, selectedCollateralToken]);

  /**
   * Collateral balance after tx. Takes current amount of principal collateral user has and adds or subtracts input amount.
   */
  const newPrincipalCollateralAmount = useMemo(() => {
    if (!principalCollateralBalance || !underlyingCollateralAmount) {
      return null;
    }

    return principalCollateralBalance.add(
      isAddCollateral ? underlyingCollateralAmount : underlyingCollateralAmount.mul(-1),
    );
  }, [isAddCollateral, principalCollateralBalance, underlyingCollateralAmount]);

  /**
   * Price of currently selected underlying collateral token (e.g. wstETH)
   */
  const selectedUnderlyingCollateralPrice = useMemo(() => {
    return tokenPriceMap[selectedUnderlyingCollateralToken];
  }, [selectedUnderlyingCollateralToken, tokenPriceMap]);

  const minDepositAmount = useMemo(() => {
    if (leverage <= 1) {
      return Decimal.MAX_DECIMAL;
    }

    if (!newPrincipalCollateralAmount || !selectedUnderlyingCollateralPrice) {
      return Decimal.MAX_DECIMAL;
    }

    const newPrincipalCollateralValue = newPrincipalCollateralAmount.mul(selectedUnderlyingCollateralPrice);
    if (newPrincipalCollateralValue.isZero()) {
      return Decimal.MAX_DECIMAL;
    }

    return new Decimal(MIN_BORROW_AMOUNT).div(newPrincipalCollateralValue.mul(leverage - 1));
  }, [leverage, newPrincipalCollateralAmount, selectedUnderlyingCollateralPrice]);

  const totalFee = useMemo(() => {
    if (
      swapPriceStatus.pending ||
      swapPriceStatus.error ||
      !swapPriceStatus.result ||
      swapPriceStatus.result.isZero()
    ) {
      return null;
    }

    const underlyingCollateralTokenPrice = getDecimalFromTokenMap(tokenPriceMap, selectedUnderlyingCollateralToken);

    if (!underlyingCollateralTokenPrice || underlyingCollateralTokenPrice.isZero()) {
      return null;
    }

    const rTokenPrice = getDecimalFromTokenMap(tokenPriceMap, R_TOKEN);

    if (!rTokenPrice || rTokenPrice.isZero()) {
      return null;
    }

    const swapPrice = Decimal.ONE.div(swapPriceStatus.result);
    const priceImpact = Decimal.ONE.sub(swapPrice.div(underlyingCollateralTokenPrice));

    // TODO: confirm this is the correct calculation
    const rPriceDeviation = Decimal.ONE.sub(rTokenPrice);

    return priceImpact.add(FLASH_MINT_FEE).add(rPriceDeviation);
  }, [
    selectedUnderlyingCollateralToken,
    swapPriceStatus.error,
    swapPriceStatus.pending,
    swapPriceStatus.result,
    tokenPriceMap,
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

  /**
   * Checks if user has set a leverage value greater than one.
   * If user is closing the position we don't need to check for leverage.
   */
  const hasLeveraged = useMemo(() => {
    return leverage > 1 || closePositionActive;
  }, [closePositionActive, leverage]);

  const hasNonEmptyInput = useMemo(
    () => !collateralAmountDecimal.isZero() || hasLeveraged,
    [collateralAmountDecimal, hasLeveraged],
  );
  const hasMinDeposit = useMemo(
    () => newPrincipalCollateralAmount?.gte(minDepositAmount) || closePositionActive,
    [closePositionActive, minDepositAmount, newPrincipalCollateralAmount],
  );

  /**
   * wallet balance for the selected collateral token
   */
  const selectedCollateralTokenBalance = useMemo(
    () => tokenBalanceMap[selectedCollateralToken],
    [selectedCollateralToken, tokenBalanceMap],
  );

  /**
   * If user is adding collateral, check if user has enough balance in wallet to deposit
   */
  const hasEnoughCollateralTokenBalance = useMemo(
    () => selectedCollateralTokenBalance?.gte(collateralAmountDecimal) || !isAddCollateral,
    [collateralAmountDecimal, isAddCollateral, selectedCollateralTokenBalance],
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
      return 'Insufficient funds for leverage position. Increase your collateral deposit to get started.';
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
    leveragePositionStatus.pending,
    isTotalSupplyWithinCollateralProtocolCap,
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

  const onToggleClosePosition = useCallback(() => {
    if (!principalCollateralBalance) {
      return;
    }

    if (!closePositionActive) {
      if (isUnderlyingCollateralToken(selectedCollateralToken)) {
        setCollateralAmount(principalCollateralBalance.toString());
        setIsAddCollateral(false);
      } else {
        const collateralConversionRate = collateralConversionRateMap[selectedCollateralToken];

        if (collateralConversionRate) {
          const collateralBalanceInSelectedCollateralToken = principalCollateralBalance.mul(collateralConversionRate);

          setCollateralAmount(collateralBalanceInSelectedCollateralToken.toString());
          setIsAddCollateral(false);
        }
      }

      setLeverage(defaultLeverage);
    } else {
      setCollateralAmount('');
      setIsAddCollateral(true);
      setLeverage(1);
    }

    setClosePositionActive(prevState => !prevState);
  }, [
    closePositionActive,
    collateralConversionRateMap,
    defaultLeverage,
    principalCollateralBalance,
    selectedCollateralToken,
  ]);

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

  useEffect(() => {
    requestLeveragePositionStep?.({
      underlyingCollateralToken: TOKEN_TO_UNDERLYING_TOKEN_MAP[selectedCollateralToken],
      collateralToken: selectedCollateralToken,
      collateralChange: isAddCollateral ? collateralAmountDecimal : collateralAmountDecimal.mul(-1),
      leverage: new Decimal(leverage),
      currentPrincipalCollateral: principalCollateralBalance ?? Decimal.ZERO,
      isClosePosition: closePositionActive, // TODO - If new user position is also zero, set this to true
      slippage,
    });
  }, [
    collateralAmountDecimal,
    isAddCollateral,
    leverage,
    requestLeveragePositionStep,
    selectedCollateralToken,
    closePositionActive,
    slippage,
    principalCollateralBalance,
  ]);

  useEffect(() => {
    if (swapPriceTime.current) {
      clearTimeout(swapPriceTime.current);
    }
    swapPriceTime.current = setTimeout(() => {
      estimateSwapPrice({
        underlyingCollateralToken: TOKEN_TO_UNDERLYING_TOKEN_MAP[selectedCollateralToken],
        tokenAmount: collateralAmountDecimal,
        leverage: new Decimal(leverage),
        router,
        slippage,
      });
    }, DEBOUNCE_IN_MS);
  }, [
    collateralAmountDecimal,
    estimateSwapPrice,
    leverage,
    requestLeveragePositionStep,
    router,
    selectedCollateralToken,
    slippage,
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

  return (
    <div className="raft__openLeveragePosition">
      <div className="raft__openLeveragePositionHeader">
        <div className="raft__openLeveragePositionHeaderTitle">
          <Link className="raft__openLeveragePositionHeaderBack" to="/">
            <Icon variant="arrow-left" size={12} />
          </Link>
          <Typography variant="heading2" weight="medium">
            Adjust Leverage Position
          </Typography>
        </div>
        <div className="raft__adjustLeveragePositionHeaderActions">
          <Button
            variant="secondary"
            text="Close Position"
            onClick={onToggleClosePosition}
            selected={closePositionActive}
          />
          <Settings />
        </div>
      </div>
      <div className="raft__openLeveragePositionInputs">
        <CurrencyInput
          label={collateralLabelComponent}
          precision={18}
          selectedToken={selectedCollateralToken}
          tokens={['stETH', 'wstETH']} // TODO - Add support for rETH and use SUPPORTED_COLLATERAL_TOKENS constant
          value={collateralAmount}
          previewValue={collateralAmountWithEllipse ?? undefined}
          maxAmountFormatted={selectedCollateralTokenBalanceValues.amountFormatted ?? undefined}
          onTokenUpdate={handleCollateralTokenChange}
          onValueUpdate={handleCollateralValueUpdate}
          disabled={closePositionActive}
          error={
            !hasEnoughCollateralTokenBalance ||
            (!hasMinDeposit && hasNonEmptyInput) ||
            errPositionOutOfCollateralPositionCap ||
            errPositionOutOfCollateralProtocolCap
          }
          errorMsg={collateralErrorMsg}
        />
        <SliderInput
          label="LEVERAGE EXPOSURE"
          value={leverage}
          min={MIN_LEVERAGE}
          max={MAX_LEVERAGE}
          step={0.1}
          disabled={closePositionActive}
          onValueChange={onLeverageChange}
        />
      </div>
      <InfoBox
        variant="warning"
        text="This feature flash mints R, and sources liquidity from decentralized exchanges. Read more about the risks here."
      />
      <LeveragePositionAfter
        liquidationPrice={liquidationPrice}
        liquidationPriceChange={liquidationPriceDropPercent}
        leverageAPR={selectedCollateralTokenLeveragedApr}
        totalFee={totalFee}
        liquidationPriceLabel="RESULTING LIQUIDATION PRICE"
        leverageAPRLabel="STAKING YIELD APR AFTER"
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
export default AdjustLeveragePosition;
