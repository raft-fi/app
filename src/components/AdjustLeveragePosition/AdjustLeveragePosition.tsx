import { useCallback, useState, useMemo, useEffect } from 'react';
import { useConnectWallet } from '@web3-onboard/react';
import { Link } from 'react-router-dom';
import { ButtonWrapper } from 'tempus-ui';
import { Decimal } from '@tempusfinance/decimal';
import { Button, CurrencyInput, Icon, SliderInput, Typography, InfoBox } from '../shared';
import {
  INPUT_PREVIEW_DIGITS,
  MIN_BORROW_AMOUNT,
  SUPPORTED_COLLATERAL_TOKENS,
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
} from '../../hooks';
import { Nullable, SupportedCollateralToken } from '../../interfaces';
import { LeveragePositionAction, LeveragePositionAfter } from '../LeveragePosition';

import './AdjustLeveragePosition.scss';
import Settings from '../Settings';

const MIN_LEVERAGE = 1;
const MAX_LEVERAGE = 6;

const OpenLeveragePosition = () => {
  const [, connect] = useConnectWallet();
  const { isWrongNetwork } = useNetwork();
  const wallet = useWallet();

  const protocolStats = useProtocolStats();
  const tokenPriceMap = useTokenPrices();
  const tokenBalanceMap = useTokenBalances();
  const collateralPositionCapMap = useCollateralPositionCaps();
  const collateralProtocolCapMap = useCollateralProtocolCaps();
  const collateralTokenAprMap = useCollateralTokenAprs();
  const [{ slippage }] = useSettingOptions();
  const { leveragePositionStatus, leveragePosition, leveragePositionStepsStatus, requestLeveragePositionStep } =
    useLeverage();

  const [collateralAmount, setCollateralAmount] = useState<string>('');
  const [selectedCollateralToken, setSelectedCollateralToken] = useState<SupportedCollateralToken>(
    SUPPORTED_COLLATERAL_TOKENS[0],
  );
  const [leverage, setLeverage] = useState<number>(MIN_LEVERAGE);
  const [actionButtonState, setActionButtonState] = useState<string>('default');
  const [isAddCollateral, setIsAddCollateral] = useState<boolean>(true);

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
  const minDepositAmount = useMemo(() => {
    if (leverage <= 1 || !MIN_BORROW_AMOUNT) {
      return Decimal.MAX_DECIMAL;
    }

    const collateralValue = selectedCollateralTokenInputValues.value;

    if (!collateralValue || collateralValue.isZero()) {
      return Decimal.MAX_DECIMAL;
    }

    return new Decimal(MIN_BORROW_AMOUNT).div(collateralValue.mul(leverage - 1));
  }, [leverage, selectedCollateralTokenInputValues.value]);

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
  const hasNonEmptyInput = useMemo(
    () => !collateralAmountDecimal.isZero() || hasLeveraged,
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
  const errTxn = useMemo(
    () => leveragePositionStatus.error || leveragePositionStepsStatus.error,
    [leveragePositionStatus.error, leveragePositionStepsStatus.error],
  );
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

    if (leveragePositionStatus.error?.message) {
      return leveragePositionStatus.error.message;
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
    leveragePositionStatus.error?.message,
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
      slippage,
    });
  }, [
    collateralAmountDecimal,
    isAddCollateral,
    leverage,
    requestLeveragePositionStep,
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
            onClick={() => {
              /* TODO */
            }}
            selected={false}
          />
          <Settings />
        </div>
      </div>
      <div className="raft__openLeveragePositionInputs">
        <CurrencyInput
          label={collateralLabelComponent}
          precision={18}
          selectedToken={selectedCollateralToken}
          tokens={[...SUPPORTED_COLLATERAL_TOKENS]}
          value={collateralAmount}
          previewValue={collateralAmountWithEllipse ?? undefined}
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
          label="LEVERAGE EXPOSURE"
          value={leverage}
          min={MIN_LEVERAGE}
          max={MAX_LEVERAGE}
          step={0.1}
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
        priceImpact={new Decimal(-0.02)}
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
export default OpenLeveragePosition;