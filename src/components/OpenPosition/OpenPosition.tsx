import { useCallback, useEffect, useMemo, useState } from 'react';
import { Decimal, DecimalFormat } from '@tempusfinance/decimal';
import { v4 as uuid } from 'uuid';
import { useConnectWallet } from '@web3-onboard/react';
import { MIN_COLLATERAL_RATIO, R_TOKEN, RaftConfig, TOKENS_WITH_PERMIT } from '@raft-fi/sdk';
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
  TokenWhitelistMap,
  TokenAllowanceMap,
  useCollateralBorrowingRates,
  useCollateralConversionRates,
  useProtocolStats,
} from '../../hooks';
import {
  COLLATERAL_TOKEN_UI_PRECISION,
  DEFAULT_MAP,
  HEALTHY_RATIO,
  HEALTHY_RATIO_BUFFER,
  INPUT_PREVIEW_DIGITS,
  MIN_BORROW_AMOUNT,
  R_TOKEN_UI_PRECISION,
  SUPPORTED_COLLATERAL_TOKENS,
  TOKEN_TO_DISPLAY_BASE_TOKEN_MAP,
  TOKEN_TO_UNDERLYING_TOKEN_MAP,
} from '../../constants';
import { SupportedCollateralTokens, TokenApprovedMap, TokenSignatureMap } from '../../interfaces';
import { getTokenValues, isCollateralToken, isDisplayBaseToken } from '../../utils';
import { Button, CurrencyInput, Typography } from '../shared';
import { PositionAfter, PositionAction } from '../Position';

import './OpenPosition.scss';

const OpenPosition = () => {
  const [, connect] = useConnectWallet();
  const { isWrongNetwork } = useNetwork();

  const protocolStats = useProtocolStats();
  const tokenPriceMap = useTokenPrices();
  const tokenBalanceMap = useTokenBalances();
  const tokenAllowanceMap = useTokenAllowances();
  const tokenWhitelistMap = useTokenWhitelists();
  const wallet = useWallet();
  const borrowingRate = useCollateralBorrowingRates();
  const collateralConversionRateMap = useCollateralConversionRates();
  const { borrow, borrowStatus } = useBorrow();
  const { approve, approveStatus } = useApprove();
  const { whitelistDelegate, whitelistDelegateStatus } = useWhitelistDelegate();

  const [tokenWhitelistMapWhenLoaded, setTokenWhitelistMapWhenLoaded] = useState<TokenWhitelistMap>(
    DEFAULT_MAP as TokenWhitelistMap,
  );
  const [tokenAllowanceMapWhenLoaded, setTokenAllowanceMapWhenLoaded] = useState<TokenAllowanceMap>(
    DEFAULT_MAP as TokenAllowanceMap,
  );
  // TODO: wait for SDK to update
  const [selectedCollateralToken, setSelectedCollateralToken] = useState<SupportedCollateralTokens>('stETH');
  const [collateralAmount, setCollateralAmount] = useState<string>('');
  const [borrowAmount, setBorrowAmount] = useState<string>('');
  const [actionButtonState, setActionButtonState] = useState<string>('default');
  const [maxButtonDisabled, setMaxButtonDisabled] = useState<boolean>(false);
  const [hasChanged, setHasChanged] = useState<boolean>(false);
  const [hasWhitelistProceeded, setHasWhitelistProceeded] = useState<boolean>(false);
  const [hasApprovalProceeded, setHasApprovalProceeded] = useState<TokenApprovedMap>(DEFAULT_MAP as TokenApprovedMap);
  const [tokenSignatureMap, setTokenSignatureMap] = useState<TokenSignatureMap>(DEFAULT_MAP as TokenSignatureMap);

  /**
   * Deposit values of currently selected collateral token
   */
  const selectedCollateralTokenInputValues = useMemo(
    () => getTokenValues(collateralAmount, tokenPriceMap[selectedCollateralToken], selectedCollateralToken),
    [collateralAmount, selectedCollateralToken, tokenPriceMap],
  );

  const borrowAmountDecimal = useMemo(() => Decimal.parse(borrowAmount, 0), [borrowAmount]);

  const selectedCollateralConfig = useMemo(() => {
    return RaftConfig.networkConfig.underlyingTokens[TOKEN_TO_UNDERLYING_TOKEN_MAP[selectedCollateralToken]]
      .supportedCollateralTokens[selectedCollateralToken];
  }, [selectedCollateralToken]);

  const selectedCollateralBorrowRate = useMemo(() => {
    if (!borrowingRate || !selectedCollateralConfig) {
      return null;
    }

    const collateralBorrowRate = borrowingRate[selectedCollateralConfig.underlyingTokenTicker];
    if (!collateralBorrowRate) {
      return null;
    }

    return collateralBorrowRate;
  }, [borrowingRate, selectedCollateralConfig]);

  const selectedCollateralDebtSupply = useMemo(() => {
    if (!protocolStats || !selectedCollateralConfig) {
      return null;
    }

    const collateralDebtSupply = protocolStats.debtSupply[selectedCollateralConfig.underlyingTokenTicker];
    if (!collateralDebtSupply) {
      return null;
    }

    return collateralDebtSupply;
  }, [protocolStats, selectedCollateralConfig]);

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
  const selectedCollateralTokenAllowance = useMemo(
    () => tokenAllowanceMap[selectedCollateralToken],
    [selectedCollateralToken, tokenAllowanceMap],
  );
  const selectedCollateralTokenWhitelist = useMemo(
    () => tokenWhitelistMap[selectedCollateralToken],
    [selectedCollateralToken, tokenWhitelistMap],
  );
  const borrowingFeeAmount = useMemo(() => {
    if (!selectedCollateralBorrowRate) {
      return null;
    }

    return Decimal.parse(borrowAmount, 0).mul(selectedCollateralBorrowRate);
  }, [borrowAmount, selectedCollateralBorrowRate]);

  // store the whitelist status at the loaded time
  useEffect(() => {
    const map = Object.entries(tokenWhitelistMap).reduce((map, [token, whitelisted]) => {
      if (tokenWhitelistMapWhenLoaded[token] === null) {
        map[token] = whitelisted;
      }
      return map;
    }, {} as TokenWhitelistMap);

    if (!Object.entries(map).every(([token, whitelisted]) => tokenWhitelistMapWhenLoaded[token] === whitelisted)) {
      setTokenWhitelistMapWhenLoaded(map);
    }
  }, [tokenWhitelistMap, tokenWhitelistMapWhenLoaded]);

  // store the allowance status at the loaded time
  useEffect(() => {
    const map = Object.entries(tokenAllowanceMap).reduce((map, [token, allowance]) => {
      if (tokenAllowanceMapWhenLoaded[token] === null) {
        map[token] = allowance;
      }
      return map;
    }, {} as TokenAllowanceMap);

    if (
      !Object.entries(map).every(
        ([token, allowance]) =>
          (tokenAllowanceMapWhenLoaded[token] === null && tokenAllowanceMap[token] === null) ||
          tokenAllowanceMapWhenLoaded[token]?.eq(allowance),
      )
    ) {
      setTokenAllowanceMapWhenLoaded(map);
    }
  }, [tokenAllowanceMap, tokenAllowanceMapWhenLoaded]);

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
   * Deposit amount of collateral converted to display collateral token (stETH)
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
  const rTokenBalanceFormatted = useMemo(() => {
    if (!rTokenBalance) {
      return '';
    }

    return DecimalFormat.format(rTokenBalance, {
      style: 'currency',
      currency: R_TOKEN,
      fractionDigits: R_TOKEN_UI_PRECISION,
      lessThanFormat: true,
    });
  }, [rTokenBalance]);

  const minBorrowFormatted = useMemo(() => DecimalFormat.format(MIN_BORROW_AMOUNT, { style: 'decimal' }), []);

  const walletConnected = useMemo(() => Boolean(wallet), [wallet]);

  const hasInputFilled = useMemo(
    () => selectedCollateralTokenInputValues.amount && borrowAmount,
    [borrowAmount, selectedCollateralTokenInputValues.amount],
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
    () => !collateralizationRatio || collateralizationRatio.gte(MIN_COLLATERAL_RATIO),
    [collateralizationRatio],
  );

  const isOverMaxBorrow = useMemo(() => {
    if (!selectedCollateralDebtSupply) {
      return true;
    }

    const maxBorrowAmount = selectedCollateralDebtSupply.div(10);
    if (borrowAmountDecimal.gt(maxBorrowAmount)) {
      return true;
    }
    return false;
  }, [borrowAmountDecimal, selectedCollateralDebtSupply]);

  const canBorrow = useMemo(
    () =>
      Boolean(
        hasInputFilled &&
          hasEnoughCollateralTokenBalance &&
          hasMinBorrow &&
          hasMinRatio &&
          !isWrongNetwork &&
          !isOverMaxBorrow,
      ),
    [hasEnoughCollateralTokenBalance, hasInputFilled, hasMinBorrow, hasMinRatio, isWrongNetwork, isOverMaxBorrow],
  );

  const hasWhitelisted = useMemo(() => Boolean(selectedCollateralTokenWhitelist), [selectedCollateralTokenWhitelist]);
  const hasEnoughCollateralAllowance = useMemo(
    () => Boolean(selectedCollateralTokenAllowance?.gte(selectedCollateralTokenInputValues.amount ?? Decimal.ZERO)),
    [selectedCollateralTokenInputValues.amount, selectedCollateralTokenAllowance],
  );
  const hasCollateralPermitSignature = useMemo(
    () => Boolean(tokenSignatureMap[selectedCollateralToken]),
    [selectedCollateralToken, tokenSignatureMap],
  );

  // steps that user need to execute when component loaded
  const executionSteps = useMemo(() => {
    // if whitelist map not yet ready,
    // or allowance map not yet ready,
    // or wrong network,
    // return 1
    if (
      tokenWhitelistMapWhenLoaded[selectedCollateralToken] === null ||
      tokenAllowanceMapWhenLoaded[selectedCollateralToken] === null ||
      isWrongNetwork
    ) {
      return 1;
    }

    let whitelistStep = 0;

    if (TOKENS_WITH_PERMIT.has(selectedCollateralToken)) {
      // token with permit, whitelistStep = 0
      whitelistStep = 0;
    } else if (hasWhitelistProceeded) {
      // user has proceeded whitelist, whitelistStep = 1
      whitelistStep = 1;
    } else if (!tokenWhitelistMapWhenLoaded[selectedCollateralToken]) {
      // not whitelisted on load, whitelistStep = 1
      whitelistStep = 1;
    }

    let collateralApprovalStep = 0;

    if (TOKENS_WITH_PERMIT.has(selectedCollateralToken)) {
      // token with permit, collateralApprovalStep = 0
      collateralApprovalStep = 0;
    } else if (hasApprovalProceeded[selectedCollateralToken]) {
      // user has proceeded approve, collateralApprovalStep = 1
      collateralApprovalStep = 1;
    } else if (
      tokenAllowanceMapWhenLoaded[selectedCollateralToken]?.lt(
        selectedCollateralTokenInputValues.amount ?? Decimal.ZERO,
      )
    ) {
      // not enough allowance on load, collateralApprovalStep = 1
      collateralApprovalStep = 1;
    }

    let collateralPermitStep = 0;

    if (!TOKENS_WITH_PERMIT.has(selectedCollateralToken)) {
      // token not with permit, collateralPermitStep = 0
      collateralPermitStep = 0;
    } else if (tokenSignatureMap[selectedCollateralToken]) {
      // user has proceeded approve, collateralPermitStep = 1
      collateralPermitStep = 1;
    } else if (selectedCollateralTokenInputValues.amount?.gt(0)) {
      // input > 0, collateralPermitStep = 1
      collateralPermitStep = 1;
    }

    const executionStep = 1;

    return whitelistStep + collateralApprovalStep + collateralPermitStep + executionStep;
  }, [
    selectedCollateralTokenInputValues.amount,
    hasApprovalProceeded,
    hasWhitelistProceeded,
    isWrongNetwork,
    selectedCollateralToken,
    tokenAllowanceMapWhenLoaded,
    tokenSignatureMap,
    tokenWhitelistMapWhenLoaded,
  ]);
  // steps that user has proceeded since component loaded
  const executedSteps = useMemo(() => {
    if (isWrongNetwork) {
      return 1;
    }

    let whitelistStep = 0;

    if (TOKENS_WITH_PERMIT.has(selectedCollateralToken)) {
      // token with permit, whitelistStep = 0
      whitelistStep = 0;
    } else if (hasWhitelistProceeded && hasWhitelisted) {
      // user has proceeded whitelist and still have whitelisted, whitelistStep = 1
      whitelistStep = 1;
    }

    let collateralApprovalStep = 0;

    if (TOKENS_WITH_PERMIT.has(selectedCollateralToken)) {
      // token with permit, collateralApprovalStep = 0
      collateralApprovalStep = 0;
    } else if (hasApprovalProceeded[selectedCollateralToken] && hasEnoughCollateralAllowance) {
      // user has proceeded approve and still have enough allowance, collateralApprovalStep = 1
      collateralApprovalStep = 1;
    }

    let collateralPermitStep = 0;

    if (!TOKENS_WITH_PERMIT.has(selectedCollateralToken)) {
      // token not with permit, collateralPermitStep = 0
      collateralPermitStep = 0;
    } else if (tokenSignatureMap[selectedCollateralToken]) {
      // user has proceeded approve, collateralPermitStep = 1
      collateralPermitStep = 1;
    }

    const executionStep = 1;

    return whitelistStep + collateralApprovalStep + collateralPermitStep + executionStep;
  }, [
    hasApprovalProceeded,
    hasEnoughCollateralAllowance,
    hasWhitelistProceeded,
    hasWhitelisted,
    isWrongNetwork,
    selectedCollateralToken,
    tokenSignatureMap,
  ]);

  const collateralErrorMsg = useMemo(() => {
    if (!hasEnoughCollateralTokenBalance) {
      return 'Insufficient funds';
    }
  }, [hasEnoughCollateralTokenBalance]);

  const debtErrorMsg = useMemo(() => {
    if (!hasMinBorrow) {
      return `You need to generate at least ${minBorrowFormatted} R`;
    }

    if (!hasMinRatio) {
      return 'Collateralization ratio is below the minimum threshold';
    }

    if (isOverMaxBorrow) {
      return 'Amount exceeds maximum debt allowed per Position';
    }
  }, [hasMinBorrow, hasMinRatio, isOverMaxBorrow, minBorrowFormatted]);

  const buttonLabel = useMemo(() => {
    if (!walletConnected) {
      return 'Connect wallet';
    }

    // data not yet loaded will set executionSteps = 1, always show "Execution"
    if (executionSteps === 1) {
      return borrowStatus?.pending ? 'Executing' : 'Execute';
    }

    if (!hasWhitelisted) {
      return whitelistDelegateStatus?.pending
        ? `Whitelisting stETH (${executedSteps}/${executionSteps})`
        : `Whitelist stETH (${executedSteps}/${executionSteps})`;
    }

    if (!hasEnoughCollateralAllowance && !hasCollateralPermitSignature) {
      return approveStatus?.pending
        ? `Approving ${selectedCollateralToken} (${executedSteps}/${executionSteps})`
        : `Approve ${selectedCollateralToken} (${executedSteps}/${executionSteps})`;
    }

    return borrowStatus?.pending
      ? `Executing (${executedSteps}/${executionSteps})`
      : `Execute (${executedSteps}/${executionSteps})`;
  }, [
    walletConnected,
    hasWhitelisted,
    hasEnoughCollateralAllowance,
    hasCollateralPermitSignature,
    borrowStatus?.pending,
    executedSteps,
    executionSteps,
    whitelistDelegateStatus?.pending,
    approveStatus?.pending,
    selectedCollateralToken,
  ]);

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

    if (hasCollateralPermitSignature) {
      borrow({
        collateralChange: new Decimal(collateralAmount),
        debtChange: new Decimal(borrowAmount),
        collateralToken: selectedCollateralToken,
        currentUserCollateral: Decimal.ZERO,
        currentUserDebt: Decimal.ZERO,
        txnId: uuid(),
        options: {
          collateralPermitSignature: tokenSignatureMap[selectedCollateralToken] ?? undefined,
        },
      });
    } else {
      const action = hasEnoughCollateralAllowance ? borrow : approve;

      action({
        collateralChange: new Decimal(collateralAmount),
        debtChange: new Decimal(borrowAmount),
        collateralToken: selectedCollateralToken,
        currentUserCollateral: Decimal.ZERO,
        currentUserDebt: Decimal.ZERO,
        txnId: uuid(),
      });
    }
  }, [
    approve,
    borrow,
    borrowAmount,
    canBorrow,
    collateralAmount,
    hasCollateralPermitSignature,
    hasEnoughCollateralAllowance,
    hasWhitelisted,
    selectedCollateralToken,
    tokenSignatureMap,
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
    if (!whitelistDelegateStatus && !approveStatus && !borrowStatus) {
      return;
    }

    if (whitelistDelegateStatus?.success) {
      setHasWhitelistProceeded(true);
    }

    if (approveStatus?.success) {
      const approvedCollateralToken = approveStatus.request.collateralToken;
      if (approveStatus.collateralPermit) {
        if (tokenSignatureMap[approvedCollateralToken] !== approveStatus.collateralPermit) {
          setTokenSignatureMap({
            ...tokenSignatureMap,
            [approvedCollateralToken]: approveStatus.collateralPermit,
          });
        }
      } else {
        if (!hasApprovalProceeded[approvedCollateralToken]) {
          setHasApprovalProceeded({
            ...hasApprovalProceeded,
            [approvedCollateralToken]: true,
          });
        }
      }
    }

    if (whitelistDelegateStatus?.pending || approveStatus?.pending || borrowStatus?.pending) {
      setActionButtonState('loading');
    } else if (whitelistDelegateStatus?.success || approveStatus?.success || borrowStatus?.success) {
      setActionButtonState('success');
    } else {
      setActionButtonState('default');
    }
  }, [approveStatus, borrowStatus, hasApprovalProceeded, tokenSignatureMap, whitelistDelegateStatus]);

  const borrowingFeePercentageFormatted = useMemo(() => {
    if (!selectedCollateralBorrowRate) {
      return null;
    }

    if (selectedCollateralBorrowRate.isZero()) {
      return 'Free';
    }

    return DecimalFormat.format(selectedCollateralBorrowRate, {
      style: 'percentage',
      fractionDigits: 2,
      pad: true,
    });
  }, [selectedCollateralBorrowRate]);

  const borrowingFeeAmountFormatted = useMemo(() => {
    if (!borrowingFeeAmount || borrowingFeeAmount.isZero()) {
      return null;
    }

    const borrowingFeeAmountFormatted = DecimalFormat.format(borrowingFeeAmount, {
      style: 'currency',
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
          tokens={SUPPORTED_COLLATERAL_TOKENS}
          value={collateralAmount}
          previewValue={collateralAmountWithEllipse ?? undefined}
          maxAmount={selectedCollateralTokenBalanceValues.amount}
          maxAmountFormatted={selectedCollateralTokenBalanceValues.amountFormatted ?? undefined}
          onTokenUpdate={handleCollateralTokenChange}
          onValueUpdate={handleCollateralValueUpdate}
          onBlur={handleCollateralTokenBlur}
          error={!hasEnoughCollateralTokenBalance || !hasMinRatio}
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
          error={!hasMinBorrow || !hasMinRatio || isOverMaxBorrow}
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
