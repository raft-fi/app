import { useCallback, useEffect, useMemo, useState } from 'react';
import { Decimal, DecimalFormat } from '@tempusfinance/decimal';
import { TokenLogo } from 'tempus-ui';
import { v4 as uuid } from 'uuid';
import { useConnectWallet } from '@web3-onboard/react';
import { CollateralToken, R_TOKEN } from '@raft-fi/sdk';
import {
  useWallet,
  useBorrow,
  useTokenPrices,
  useTokenBalances,
  useNetwork,
  useTokenAllowances,
  useTokenWhitelists,
  useApprove,
  useWhitelistDelegate,
} from '../../hooks';
import {
  COLLATERAL_TOKEN_UI_PRECISION,
  DISPLAY_BASE_TOKEN,
  HEALTHY_RATIO,
  HEALTHY_RATIO_BUFFER,
  LIQUIDATION_UPPER_RATIO,
  MIN_BORROW_AMOUNT,
  SUPPORTED_COLLATERAL_TOKENS,
} from '../../constants';
import { getCollateralRatioLevel, getCollateralRatioLabel, getTokenValues, isCollateralToken } from '../../utils';
import { Button, CurrencyInput, Typography, Icon, Loading, ValueLabel } from '../shared';

import './OpenPosition.scss';

const OpenPosition = () => {
  const [, connect] = useConnectWallet();
  const { isWrongNetwork, switchToSupportedNetwork } = useNetwork();

  const tokenPriceMap = useTokenPrices();
  const tokenBalanceMap = useTokenBalances();
  const tokenAllowanceMap = useTokenAllowances();
  const tokenWhitelistMap = useTokenWhitelists();
  const wallet = useWallet();
  const { borrow, borrowStatus } = useBorrow();
  const { approve, approveStatus } = useApprove();
  const { whitelistDelegate, whitelistDelegateStatus } = useWhitelistDelegate();

  const [selectedCollateralToken, setSelectedCollateralToken] = useState<CollateralToken>('stETH');
  const [collateralAmount, setCollateralAmount] = useState<string>('');
  const [borrowAmount, setBorrowAmount] = useState<string>('');
  const [actionButtonState, setActionButtonState] = useState<string>('default');
  const [maxButtonDisabled, setMaxButtonDisabled] = useState<boolean>(false);
  const [hasChanged, setHasChanged] = useState<boolean>(false);

  const collateralTokenValues = useMemo(
    () => getTokenValues(collateralAmount, tokenPriceMap[selectedCollateralToken], selectedCollateralToken),
    [collateralAmount, selectedCollateralToken, tokenPriceMap],
  );
  const borrowTokenValues = useMemo(
    () => getTokenValues(borrowAmount, tokenPriceMap[R_TOKEN], R_TOKEN),
    [borrowAmount, tokenPriceMap],
  );
  const baseTokenValues = useMemo(
    () => getTokenValues(borrowAmount, tokenPriceMap[DISPLAY_BASE_TOKEN], R_TOKEN),
    [borrowAmount, tokenPriceMap],
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
  const selectedCollateralTokenAllowance = useMemo(
    () => tokenAllowanceMap[selectedCollateralToken],
    [selectedCollateralToken, tokenAllowanceMap],
  );
  const selectedCollateralTokenWhitelist = useMemo(
    () => tokenWhitelistMap[selectedCollateralToken],
    [selectedCollateralToken, tokenWhitelistMap],
  );

  /**
   * Fill in collateral and debt input fields automatically if they are empty.
   * Debt is set to 3k (minimum) and collateral is set to that collateral ratio is around 220% or a bit more.
   */
  useEffect(() => {
    const collateralBalanceValid =
      tokenBalanceMap[selectedCollateralToken] && !tokenBalanceMap[selectedCollateralToken]?.isZero();
    const collateralPriceValid =
      tokenPriceMap[selectedCollateralToken] && !tokenPriceMap[selectedCollateralToken]?.isZero();
    const rTokenPriceValid = tokenPriceMap[R_TOKEN] && !tokenPriceMap[R_TOKEN].isZero();

    // when input is not dirty, check whether price and balance are available
    if (!hasChanged && rTokenPriceValid && collateralPriceValid && collateralBalanceValid) {
      const collateralBalance = tokenBalanceMap[selectedCollateralToken] as Decimal;
      const collateralPrice = tokenPriceMap[selectedCollateralToken] as Decimal;
      const rTokenPrice = tokenPriceMap[R_TOKEN] as Decimal;

      // Borrow amount is always set to min amount
      const borrowAmount = new Decimal(MIN_BORROW_AMOUNT);
      const borrowAmountValue = rTokenPrice.mul(borrowAmount);

      // Calculate minimum collateral amount so that resulting collateral ratio is at least 220%
      const collateralAmount = borrowAmountValue.mul(HEALTHY_RATIO + HEALTHY_RATIO_BUFFER).div(collateralPrice);

      // TODO - Add ceil() function to decimal library
      const truncatedCollateral = new Decimal(collateralAmount.toTruncated(COLLATERAL_TOKEN_UI_PRECISION));
      const collateralAmountCeiled = truncatedCollateral.lt(collateralAmount)
        ? truncatedCollateral.add(`${'0.'.padEnd(COLLATERAL_TOKEN_UI_PRECISION + 1, '0')}1`)
        : truncatedCollateral;

      // Only fill in calculated values if user has enough collateral
      if (collateralBalance.gte(collateralAmountCeiled)) {
        setCollateralAmount(collateralAmountCeiled.toString());
        setBorrowAmount(borrowAmount.toString());
      }
    }
  }, [
    hasChanged,
    selectedCollateralToken,
    selectedCollateralTokenBalanceValues.amount,
    selectedCollateralTokenBalanceValues.price,
    tokenBalanceMap,
    tokenPriceMap,
  ]);

  const baseTokenAmount = useMemo(() => {
    if (!collateralTokenValues.amount || !collateralTokenValues.value) {
      return Decimal.ZERO;
    }

    switch (selectedCollateralToken) {
      case 'ETH':
      case 'stETH':
      default:
        return collateralTokenValues.amount;
      case 'wstETH':
        if (!collateralTokenValues.price || !baseTokenValues.price || baseTokenValues.price.isZero()) {
          return null;
        }

        return collateralTokenValues.value.div(baseTokenValues.price);
    }
  }, [
    baseTokenValues.price,
    collateralTokenValues.amount,
    collateralTokenValues.price,
    collateralTokenValues.value,
    selectedCollateralToken,
  ]);
  const baseTokenAmountFormatted = useMemo(
    () =>
      DecimalFormat.format(baseTokenAmount ?? Decimal.ZERO, {
        style: 'currency',
        currency: DISPLAY_BASE_TOKEN,
        fractionDigits: COLLATERAL_TOKEN_UI_PRECISION,
        lessThanFormat: true,
      }),
    [baseTokenAmount],
  );

  const collateralizationRatio = useMemo(() => {
    if (collateralTokenValues.value === null || borrowTokenValues.value === null || borrowTokenValues.value.isZero()) {
      return null;
    }

    const borrowAmountDecimal = new Decimal(borrowAmount || 0);
    if (borrowAmountDecimal.lt(MIN_BORROW_AMOUNT)) {
      return null;
    }

    return collateralTokenValues.value.div(borrowTokenValues.value);
  }, [borrowAmount, borrowTokenValues.value, collateralTokenValues.value]);
  const collateralizationRatioFormatted = useMemo(
    () =>
      collateralizationRatio
        ? DecimalFormat.format(collateralizationRatio, { style: 'percentage', fractionDigits: 2 })
        : 'N/A',
    [collateralizationRatio],
  );

  const collateralRatioLevel = useMemo(() => getCollateralRatioLevel(collateralizationRatio), [collateralizationRatio]);
  const collateralRatioLabel = useMemo(() => getCollateralRatioLabel(collateralizationRatio), [collateralizationRatio]);

  const minBorrowFormatted = useMemo(() => DecimalFormat.format(MIN_BORROW_AMOUNT, { style: 'decimal' }), []);

  const walletConnected = useMemo(() => Boolean(wallet), [wallet]);

  const hasInputFilled = useMemo(
    () => collateralTokenValues.amount && borrowTokenValues.amount,
    [borrowTokenValues.amount, collateralTokenValues.amount],
  );
  const hasEnoughCollateralTokenBalance = useMemo(
    () =>
      !walletConnected ||
      !collateralTokenValues.amount ||
      Boolean(
        selectedCollateralTokenBalanceValues.amount &&
          collateralTokenValues.amount.lte(selectedCollateralTokenBalanceValues.amount),
      ),
    [collateralTokenValues.amount, selectedCollateralTokenBalanceValues, walletConnected],
  );
  const hasWhitelisted = useMemo(() => Boolean(selectedCollateralTokenWhitelist), [selectedCollateralTokenWhitelist]);
  const hasEnoughCollateralAllowance = useMemo(
    () => Boolean(selectedCollateralTokenAllowance?.gte(collateralTokenValues.amount ?? Decimal.ZERO)),
    [collateralTokenValues.amount, selectedCollateralTokenAllowance],
  );
  const hasMinBorrow = useMemo(
    () => !borrowTokenValues.amount || borrowTokenValues.amount.gte(MIN_BORROW_AMOUNT),
    [borrowTokenValues.amount],
  );
  const hasMinRatio = useMemo(
    () => !collateralizationRatio || collateralizationRatio.gte(LIQUIDATION_UPPER_RATIO),
    [collateralizationRatio],
  );
  const canBorrow = useMemo(
    () => hasInputFilled && hasEnoughCollateralTokenBalance && hasMinBorrow && hasMinRatio,
    [hasEnoughCollateralTokenBalance, hasInputFilled, hasMinBorrow, hasMinRatio],
  );

  const executionSteps = useMemo(() => {
    const whitelistStep = hasWhitelisted ? 0 : 1;
    const collateralApprovalStep = hasEnoughCollateralAllowance ? 0 : 1;
    const executionStep = 1;

    return whitelistStep + collateralApprovalStep + executionStep;
  }, [hasEnoughCollateralAllowance, hasWhitelisted]);

  const collateralErrorMsg = useMemo(() => {
    if (!hasEnoughCollateralTokenBalance) {
      return 'Insufficient funds';
    }
  }, [hasEnoughCollateralTokenBalance]);

  const debtErrorMsg = useMemo(() => {
    if (!hasMinBorrow) {
      return `You need to borrow at least ${minBorrowFormatted} R`;
    }

    if (!hasMinRatio) {
      return 'Collateralization ratio is below the minimum threshold';
    }
  }, [hasMinBorrow, hasMinRatio, minBorrowFormatted]);

  const buttonLabel = useMemo(() => {
    if (!walletConnected) {
      return 'Connect wallet';
    }

    if (!hasWhitelisted) {
      return actionButtonState === 'loading'
        ? `Whitelisting stETH (1/${executionSteps})`
        : `Whitelist stETH (1/${executionSteps})`;
    }

    if (!hasEnoughCollateralAllowance) {
      return actionButtonState === 'loading'
        ? `Approving ${selectedCollateralToken} (1/${executionSteps})`
        : `Approve ${selectedCollateralToken} (1/${executionSteps})`;
    }

    return actionButtonState === 'loading' ? 'Executing' : 'Borrow';
  }, [
    walletConnected,
    hasWhitelisted,
    hasEnoughCollateralAllowance,
    actionButtonState,
    executionSteps,
    selectedCollateralToken,
  ]);

  const buttonDisabled = useMemo(
    () => actionButtonState === 'loading' || (walletConnected && !canBorrow),
    [canBorrow, actionButtonState, walletConnected],
  );

  const onConnectWallet = useCallback(() => {
    connect();
  }, [connect]);

  const onAction = useCallback(() => {
    if (!canBorrow) {
      return;
    }

    if (!hasWhitelisted) {
      whitelistDelegate({ token: selectedCollateralToken, txnId: uuid() });
      return;
    }

    const action = hasEnoughCollateralAllowance ? borrow : approve;

    action({
      collateralChange: new Decimal(collateralAmount),
      debtChange: new Decimal(borrowAmount),
      collateralToken: selectedCollateralToken,
      currentUserCollateral: Decimal.ZERO,
      currentUserDebt: Decimal.ZERO,
      txnId: uuid(),
    });
  }, [
    approve,
    borrow,
    borrowAmount,
    canBorrow,
    collateralAmount,
    hasEnoughCollateralAllowance,
    hasWhitelisted,
    selectedCollateralToken,
    whitelistDelegate,
  ]);

  const handleCollateralTokenChange = useCallback((token: string) => {
    if (isCollateralToken(token)) {
      setMaxButtonDisabled(false);
      setSelectedCollateralToken(token);
      setHasChanged(true);
    }
  }, []);

  const handleCollateralTokenBlur = useCallback(() => {
    // if borrow input is not empty, do nth
    if (borrowTokenValues.amount) {
      return;
    }

    // if borrow input is null, borrowTokenValues.price will be null, so use the price map here
    const borrowTokenPrice = tokenPriceMap[R_TOKEN];

    if (!collateralTokenValues.value || !borrowTokenPrice || borrowTokenPrice.isZero() || !HEALTHY_RATIO) {
      return;
    }

    const defaultBorrowAmount = collateralTokenValues.value
      .div(borrowTokenPrice)
      .div(HEALTHY_RATIO + HEALTHY_RATIO_BUFFER)
      .toString();
    setBorrowAmount(defaultBorrowAmount);
    setHasChanged(true);
  }, [borrowTokenValues.amount, collateralTokenValues.value, tokenPriceMap]);

  const handleBorrowTokenBlur = useCallback(() => {
    // if collateral input is not empty, do nth
    if (collateralTokenValues.amount) {
      return;
    }

    // if collateral input is null, collateralTokenValues.price will be null, so use the price map here
    const collateralTokenPrice = tokenPriceMap[selectedCollateralToken];

    if (!borrowTokenValues.value || !collateralTokenPrice || collateralTokenPrice.isZero()) {
      return;
    }

    const defaultCollateralAmount = borrowTokenValues.value
      .mul(HEALTHY_RATIO + HEALTHY_RATIO_BUFFER)
      .div(collateralTokenPrice)
      .toString();
    setCollateralAmount(defaultCollateralAmount);
    setHasChanged(true);
  }, [borrowTokenValues.value, collateralTokenValues.amount, selectedCollateralToken, tokenPriceMap]);

  /**
   * Update action button state based on current approve/borrow request status
   */
  useEffect(() => {
    if (!whitelistDelegateStatus && !approveStatus && !borrowStatus) {
      return;
    }

    if (whitelistDelegateStatus?.pending || approveStatus?.pending || borrowStatus?.pending) {
      setActionButtonState('loading');
    } else if (whitelistDelegateStatus?.success || approveStatus?.success || borrowStatus?.success) {
      setActionButtonState('success');
    } else {
      setActionButtonState('default');
    }
  }, [approveStatus, borrowStatus, whitelistDelegateStatus]);

  const collateralInputFiatValue = useMemo(() => {
    if (!collateralTokenValues.valueFormatted || Decimal.parse(collateralAmount, 0).isZero()) {
      return '';
    }

    return `~${collateralTokenValues.valueFormatted}`;
  }, [collateralTokenValues.valueFormatted, collateralAmount]);

  const borrowInputFiatValue = useMemo(() => {
    if (!borrowTokenValues.valueFormatted || Decimal.parse(borrowAmount, 0).isZero()) {
      return '';
    }

    return `~${borrowTokenValues.valueFormatted}`;
  }, [borrowTokenValues.valueFormatted, borrowAmount]);

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
          fiatValue={collateralInputFiatValue}
          selectedToken={selectedCollateralToken}
          tokens={SUPPORTED_COLLATERAL_TOKENS}
          value={collateralAmount}
          onTokenUpdate={handleCollateralTokenChange}
          onValueUpdate={handleCollateralValueUpdate}
          onBlur={handleCollateralTokenBlur}
          error={!hasEnoughCollateralTokenBalance || !hasMinRatio}
          errorMsg={collateralErrorMsg}
        />
        <CurrencyInput
          label="YOU GENERATE"
          precision={18}
          fiatValue={borrowInputFiatValue}
          selectedToken={R_TOKEN}
          tokens={[R_TOKEN]}
          value={borrowAmount}
          onValueUpdate={handleBorrowValueUpdate}
          onBlur={handleBorrowTokenBlur}
          error={!hasMinBorrow || !hasMinRatio}
          errorMsg={debtErrorMsg}
        />
      </div>
      <div className="raft__openPosition__data">
        <div className="raft__openPosition__data__position">
          <div className="raft__openPosition__data__position__title">
            <Typography variant="overline">POSITION AFTER</Typography>
            <Icon variant="info" size="tiny" />
          </div>
          <ul className="raft__openPosition__data__position__data">
            <li className="raft__openPosition__data__position__data__deposit">
              <TokenLogo type={`token-${DISPLAY_BASE_TOKEN}`} size={20} />
              <ValueLabel value={baseTokenAmountFormatted} valueSize="body" tickerSize="caption" />
              {collateralTokenValues.valueFormatted && (
                <Typography
                  className="raft__openPosition__data__position__data__deposit__value"
                  variant="body"
                  weight="medium"
                  color="text-secondary"
                >
                  (
                  <ValueLabel
                    value={collateralTokenValues.valueFormatted}
                    tickerSize="caption"
                    valueSize="body"
                    color="text-secondary"
                  />
                  )
                </Typography>
              )}
            </li>
            <li className="raft__openPosition__data__position__data__debt">
              <TokenLogo type={`token-${R_TOKEN}`} size={20} />
              <ValueLabel
                value={borrowTokenValues.amountFormatted ?? `0.00 ${R_TOKEN}`}
                valueSize="body"
                tickerSize="caption"
              />
            </li>
            <li className="raft__openPosition__data__position__data__ratio">
              {!collateralizationRatio || collateralizationRatio.isZero() ? (
                <>
                  <div className="raft__openPosition__data__position__data__ratio__empty-status" />
                  <Typography variant="body">N/A</Typography>
                </>
              ) : (
                <>
                  <Icon variant="arrow-up" size="tiny" />
                  <div
                    className={`raft__openPosition__data__position__data__ratio__status status-${collateralRatioLevel}`}
                  />
                  <ValueLabel value={collateralizationRatioFormatted} valueSize="body" tickerSize="caption" />
                  <Typography variant="body" weight="medium" color="text-secondary">
                    ({collateralRatioLabel})
                  </Typography>
                </>
              )}
            </li>
          </ul>
        </div>
        <div className="raft__openPosition__data__others">
          <div className="raft__openPosition__data__protocol-fee__title">
            <Typography variant="overline">PROTOCOL FEES</Typography>
            <Icon variant="info" size="tiny" />
          </div>
          <div className="raft__openPosition__data__protocol-fee__value">
            <Typography variant="body" weight="medium">
              Free
            </Typography>
          </div>
        </div>
      </div>
      <div className="raft__openPosition__action">
        {isWrongNetwork ? (
          <Button
            className="raft__openPosition__action__wrongNetwork"
            variant="error"
            size="large"
            text="Unsupported network"
            onClick={switchToSupportedNetwork}
          />
        ) : (
          <Button
            variant="primary"
            size="large"
            onClick={walletConnected ? onAction : onConnectWallet}
            disabled={buttonDisabled}
          >
            {actionButtonState === 'loading' && <Loading />}
            <Typography variant="button-label" color="text-primary-inverted">
              {buttonLabel}
            </Typography>
          </Button>
        )}
      </div>
    </div>
  );
};
export default OpenPosition;
