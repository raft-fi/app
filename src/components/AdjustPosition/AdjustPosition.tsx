import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Decimal } from '@tempusfinance/decimal';
import { ButtonWrapper } from 'tempus-ui';
import { v4 as uuid } from 'uuid';
import { MIN_COLLATERAL_RATIO, R_TOKEN, TOKENS_WITH_PERMIT } from '@raft-fi/sdk';
import {
  TokenAllowanceMap,
  TokenWhitelistMap,
  useApprove,
  useBorrow,
  useCollateralBorrowingRates,
  useCollateralConversionRates,
  useCollateralPositionCaps,
  useCollateralProtocolCaps,
  useCollateralTokenConfig,
  useProtocolStats,
  useTokenAllowances,
  useTokenBalances,
  useTokenPrices,
  useTokenWhitelists,
  useWhitelistDelegate,
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
  DEFAULT_MAP,
  INPUT_PREVIEW_DIGITS,
  MINIMUM_UI_AMOUNT_FOR_BORROW_FEE,
  MIN_BORROW_AMOUNT,
  R_TOKEN_UI_PRECISION,
  SUPPORTED_COLLATERAL_TOKEN_SETTINGS,
  TOKEN_TO_DISPLAY_BASE_TOKEN_MAP,
} from '../../constants';
import {
  Nullable,
  Position,
  SupportedCollateralToken,
  SupportedUnderlyingCollateralToken,
  TokenApprovedMap,
  TokenSignatureMap,
} from '../../interfaces';
import { Button, CurrencyInput, Typography } from '../shared';
import { PositionAction, PositionAfter } from '../Position';

import './AdjustPosition.scss';

interface AdjustPositionProps {
  position: Position;
}

const AdjustPosition: FC<AdjustPositionProps> = ({ position }) => {
  const { borrow, borrowStatus } = useBorrow();
  const { approve, approveStatus } = useApprove();
  const { whitelistDelegate, whitelistDelegateStatus } = useWhitelistDelegate();
  const tokenBalanceMap = useTokenBalances();
  const tokenPriceMap = useTokenPrices();
  const tokenAllowanceMap = useTokenAllowances();
  const tokenWhitelistMap = useTokenWhitelists();
  const borrowingRateMap = useCollateralBorrowingRates();
  const collateralConversionRateMap = useCollateralConversionRates();
  const collateralPositionCapMap = useCollateralPositionCaps();
  const collateralProtocolCapMap = useCollateralProtocolCaps();
  const protocolStats = useProtocolStats();
  const { collateralTokenConfig, setCollateralTokenForConfig } = useCollateralTokenConfig();

  const { collateralBalance, debtBalance } = position;
  // already checked underlyingCollateralToken is not null to render this component
  const underlyingCollateralToken = position.underlyingCollateralToken as SupportedUnderlyingCollateralToken;
  const displayBaseToken = SUPPORTED_COLLATERAL_TOKEN_SETTINGS[underlyingCollateralToken].displayBaseToken;

  const [tokenWhitelistMapWhenLoaded, setTokenWhitelistMapWhenLoaded] = useState<TokenWhitelistMap>(
    DEFAULT_MAP as TokenWhitelistMap,
  );
  const [tokenAllowanceMapWhenLoaded, setTokenAllowanceMapWhenLoaded] = useState<TokenAllowanceMap>(
    DEFAULT_MAP as TokenAllowanceMap,
  );
  const [selectedCollateralToken, setSelectedCollateralToken] = useState<SupportedCollateralToken>(displayBaseToken);
  const [collateralAmount, setCollateralAmount] = useState<string>('');
  const [borrowAmount, setBorrowAmount] = useState<string>('');
  const [isAddCollateral, setIsAddCollateral] = useState<boolean>(true);
  const [isAddDebt, setIsAddDebt] = useState<boolean>(true);
  const [closePositionActive, setClosePositionActive] = useState<boolean>(false);
  const [transactionState, setTransactionState] = useState<string>('default');
  const [hasWhitelistProceeded, setHasWhitelistProceeded] = useState<boolean>(false);
  const [hasApprovalProceeded, setHasApprovalProceeded] = useState<TokenApprovedMap>(DEFAULT_MAP as TokenApprovedMap);
  const [tokenSignatureMap, setTokenSignatureMap] = useState<TokenSignatureMap>(DEFAULT_MAP as TokenSignatureMap);

  // when selectedCollateralToken changed, change the token config as well
  useEffect(() => {
    setCollateralTokenForConfig(selectedCollateralToken);
  }, [selectedCollateralToken, setCollateralTokenForConfig]);

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
   * Update action button state based on current borrow request status
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
      if (approveStatus.collateralPermit || approveStatus.rPermit) {
        if (
          approveStatus.collateralPermit &&
          tokenSignatureMap[approvedCollateralToken] !== approveStatus.collateralPermit
        ) {
          setTokenSignatureMap({
            ...tokenSignatureMap,
            [approvedCollateralToken]: approveStatus.collateralPermit,
          });
        }
        if (approveStatus.rPermit && tokenSignatureMap[R_TOKEN] !== approveStatus.rPermit) {
          setTokenSignatureMap({
            ...tokenSignatureMap,
            [R_TOKEN]: approveStatus.rPermit,
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
      setTransactionState('loading');
    } else if (whitelistDelegateStatus?.success || approveStatus?.success || borrowStatus?.success) {
      setTransactionState('success');
    } else {
      setTransactionState('default');
    }
  }, [approveStatus, borrowStatus, hasApprovalProceeded, tokenSignatureMap, whitelistDelegateStatus]);

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
  const selectedCollateralTokenAllowance = useMemo(
    () => tokenAllowanceMap[selectedCollateralToken],
    [selectedCollateralToken, tokenAllowanceMap],
  );
  const selectedCollateralTokenWhitelist = useMemo(
    () => tokenWhitelistMap[selectedCollateralToken],
    [selectedCollateralToken, tokenWhitelistMap],
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
    () => !newCollateralizationRatio || newCollateralizationRatio.gte(MIN_COLLATERAL_RATIO) || isClosePosition,
    [isClosePosition, newCollateralizationRatio],
  );
  const isInputNonEmpty = useMemo(
    () => !(collateralAmountDecimal.isZero() && borrowAmountDecimal.isZero()),
    [borrowAmountDecimal, collateralAmountDecimal],
  );
  const hasWhitelisted = useMemo(() => Boolean(selectedCollateralTokenWhitelist), [selectedCollateralTokenWhitelist]);
  const hasEnoughCollateralAllowance = useMemo(
    () => Boolean(selectedCollateralTokenAllowance?.gte(collateralAmountDecimal)) || !isAddCollateral,
    [collateralAmountDecimal, isAddCollateral, selectedCollateralTokenAllowance],
  );
  const hasCollateralPermitSignature = useMemo(
    () => Boolean(tokenSignatureMap[selectedCollateralToken]),
    [selectedCollateralToken, tokenSignatureMap],
  );
  const hasDebtPermitSignature = useMemo(() => Boolean(tokenSignatureMap[R_TOKEN]), [tokenSignatureMap]);
  const needCollateralPermitSignature = useMemo(
    () => TOKENS_WITH_PERMIT.has(selectedCollateralToken) && collateralAmountDecimal.gt(0) && isAddCollateral,
    [collateralAmountDecimal, isAddCollateral, selectedCollateralToken],
  );
  const needDebtPermitSignature = useMemo(
    () => !TOKENS_WITH_PERMIT.has(selectedCollateralToken) && !isAddDebt,
    [isAddDebt, selectedCollateralToken],
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

    const selectedCollateralTokenPositionCap = getDecimalFromTokenMap(
      collateralPositionCapMap,
      selectedCollateralToken,
    );

    if (!collateralSupply || !selectedCollateralTokenPositionCap || !newCollateralInUnderlyingTokenValues.amount) {
      return false;
    }

    // TODO: assume 1:1 of the token rate here, should calculate the conversion rate
    return newCollateralInUnderlyingTokenValues.amount.lte(selectedCollateralTokenPositionCap);
  }, [
    collateralAmountDecimal,
    collateralPositionCapMap,
    collateralSupply,
    isAddCollateral,
    newCollateralInUnderlyingTokenValues.amount,
    selectedCollateralToken,
  ]);

  const isPositionWithinCollateralProtocolCap = useMemo(() => {
    // In case user is not adding collateral, we should ignore cap
    if (collateralAmountDecimal.isZero() || !isAddCollateral) {
      return true;
    }

    const selectedCollateralTokenProtocolCap = getDecimalFromTokenMap(
      collateralProtocolCapMap,
      selectedCollateralToken,
    );

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
    collateralProtocolCapMap,
    collateralSupply,
    currentUnderlyingCollateralTokenValues.amount,
    isAddCollateral,
    newCollateralInUnderlyingTokenValues.amount,
    selectedCollateralToken,
  ]);

  const isTotalSupplyWithinCollateralProtocolCap = useMemo(() => {
    // In case user is not adding collateral, we should ignore cap
    if (collateralAmountDecimal.isZero() || !isAddCollateral) {
      return true;
    }

    const selectedCollateralTokenProtocolCap = getDecimalFromTokenMap(
      collateralProtocolCapMap,
      selectedCollateralToken,
    );

    if (!collateralSupply || !selectedCollateralTokenProtocolCap) {
      return false;
    }

    return collateralSupply.lte(selectedCollateralTokenProtocolCap);
  }, [collateralAmountDecimal, collateralProtocolCapMap, collateralSupply, isAddCollateral, selectedCollateralToken]);

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

  // steps that user need to execute when component loaded
  const executionSteps = useMemo(() => {
    // if whitelist map not yet ready,
    // or allowance map not yet ready,
    // return 1
    if (
      tokenWhitelistMapWhenLoaded[selectedCollateralToken] === null ||
      tokenAllowanceMapWhenLoaded[selectedCollateralToken] === null
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
    } else if (tokenAllowanceMapWhenLoaded[selectedCollateralToken]?.lt(collateralAmountDecimal) && isAddCollateral) {
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
    } else if (collateralAmountDecimal.gt(0) && isAddCollateral) {
      // input > zero and depositing, collateralPermitStep = 1
      collateralPermitStep = 1;
    }

    let debtPermitStep = 0;

    if (TOKENS_WITH_PERMIT.has(selectedCollateralToken)) {
      // token with permit, no need to permit R, debtPermitStep = 0
      debtPermitStep = 0;
    } else if (collateralAmountDecimal.isZero()) {
      // collateral is zero, treat it as token with permit, no need to permit R, , debtPermitStep = 0
      debtPermitStep = 0;
    } else if (tokenSignatureMap[R_TOKEN]) {
      // user has proceeded approve for R, debtPermitStep = 1
      debtPermitStep = 1;
    } else if (!isAddDebt) {
      // if R input amount is -ve, debtPermitStep = 1
      debtPermitStep = 1;
    }

    const executionStep = 1;

    return whitelistStep + collateralApprovalStep + collateralPermitStep + debtPermitStep + executionStep;
  }, [
    collateralAmountDecimal,
    hasApprovalProceeded,
    hasWhitelistProceeded,
    isAddCollateral,
    isAddDebt,
    selectedCollateralToken,
    tokenAllowanceMapWhenLoaded,
    tokenSignatureMap,
    tokenWhitelistMapWhenLoaded,
  ]);
  // steps that user has proceeded since component loaded
  const executedSteps = useMemo(() => {
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

    let debtPermitStep = 0;

    if (TOKENS_WITH_PERMIT.has(selectedCollateralToken)) {
      // token with permit, no need to permit R, debtPermitStep = 0
      debtPermitStep = 0;
    } else if (collateralAmountDecimal.isZero()) {
      // collateral is zero, treat it as token with permit, no need to permit R, , debtPermitStep = 0
      debtPermitStep = 0;
    } else if (tokenSignatureMap[R_TOKEN]) {
      // user has proceeded approve for R, debtPermitStep = 1
      debtPermitStep = 1;
    }

    const executionStep = 1;

    return whitelistStep + collateralApprovalStep + collateralPermitStep + debtPermitStep + executionStep;
  }, [
    collateralAmountDecimal,
    hasApprovalProceeded,
    hasEnoughCollateralAllowance,
    hasWhitelistProceeded,
    hasWhitelisted,
    selectedCollateralToken,
    tokenSignatureMap,
  ]);

  const collateralErrorMsg = useMemo(() => {
    if (!hasEnoughCollateralTokenBalance) {
      return 'Insufficient funds';
    }

    if (!isPositionWithinCollateralPositionCap) {
      const collateralPositionCapFormatted = formatCurrency(collateralPositionCapMap[selectedCollateralToken], {
        currency: selectedCollateralToken,
        fractionDigits: 0,
      });
      return (
        `Deposit amount exceeds the position collateral cap of ${collateralPositionCapFormatted}. ` +
        `Please reduce the deposit amount.`
      );
    }

    if (!isPositionWithinCollateralProtocolCap) {
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
    hasEnoughCollateralTokenBalance,
    hasEnoughToWithdraw,
    hasMinNewRatio,
    isPositionWithinCollateralPositionCap,
    isPositionWithinCollateralProtocolCap,
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

    if (!isPositionWithinDebtPositionCap) {
      return 'Amount exceeds maximum debt allowed per Position';
    }
  }, [hasMinBorrow, hasMinNewRatio, hasNonNegativeDebt, isPositionWithinDebtPositionCap]);

  const buttonLabel = useMemo(() => {
    // data not yet loaded will set executionSteps = 1, always show "Execution"
    if (executionSteps === 1) {
      return borrowStatus?.pending ? 'Executing' : 'Execute';
    }

    if (!isTotalSupplyWithinCollateralProtocolCap) {
      const collateralProtocolCapFormatted = formatCurrency(collateralProtocolCapMap[selectedCollateralToken], {
        currency: selectedCollateralToken,
        fractionDigits: 0,
      });
      return `Protocol collateral cap of ${collateralProtocolCapFormatted} reached. Please check again later.`;
    }

    if (!hasEnoughDebtTokenBalance && hasNonNegativeDebt) {
      return `You need ${formattedMissingBorrowAmount} more R to close your Position`;
    }

    if (!hasWhitelisted) {
      return whitelistDelegateStatus?.pending
        ? `Whitelisting ${selectedCollateralToken} (${executedSteps}/${executionSteps})`
        : `Whitelist ${selectedCollateralToken} (${executedSteps}/${executionSteps})`;
    }

    if (
      (!hasEnoughCollateralAllowance && !TOKENS_WITH_PERMIT.has(selectedCollateralToken)) ||
      (!hasCollateralPermitSignature && needCollateralPermitSignature)
    ) {
      return approveStatus?.pending
        ? `Approving ${selectedCollateralToken} (${executedSteps}/${executionSteps})`
        : `Approve ${selectedCollateralToken} (${executedSteps}/${executionSteps})`;
    }

    if (!hasDebtPermitSignature && needDebtPermitSignature) {
      return approveStatus?.pending
        ? `Approving R (${executedSteps}/${executionSteps})`
        : `Approve R (${executedSteps}/${executionSteps})`;
    }

    if (closePositionActive && borrowStatus?.pending) {
      return `Executing (${executedSteps}/${executionSteps})`;
    }

    return `Execute (${executedSteps}/${executionSteps})`;
  }, [
    executionSteps,
    isTotalSupplyWithinCollateralProtocolCap,
    hasEnoughDebtTokenBalance,
    hasNonNegativeDebt,
    hasWhitelisted,
    hasEnoughCollateralAllowance,
    selectedCollateralToken,
    hasCollateralPermitSignature,
    needCollateralPermitSignature,
    hasDebtPermitSignature,
    needDebtPermitSignature,
    closePositionActive,
    borrowStatus?.pending,
    executedSteps,
    collateralProtocolCapMap,
    formattedMissingBorrowAmount,
    whitelistDelegateStatus?.pending,
    approveStatus?.pending,
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

    if (!hasWhitelisted) {
      whitelistDelegate({ token: selectedCollateralToken, txnId: uuid() });
      return;
    }

    if (!hasEnoughCollateralAllowance && !TOKENS_WITH_PERMIT.has(selectedCollateralToken)) {
      approve({
        collateralChange: collateralAmountDecimal.mul(isAddCollateral ? 1 : -1),
        debtChange: Decimal.ZERO,
        collateralToken: selectedCollateralToken,
        currentUserCollateral: collateralBalance,
        currentUserDebt: debtBalance,
        closePosition: closePositionActive,
        txnId: uuid(),
      });
      return;
    }

    if (!hasCollateralPermitSignature && needCollateralPermitSignature) {
      approve({
        collateralChange: collateralAmountDecimal.mul(isAddCollateral ? 1 : -1),
        debtChange: Decimal.ZERO,
        collateralToken: selectedCollateralToken,
        currentUserCollateral: collateralBalance,
        currentUserDebt: debtBalance,
        closePosition: closePositionActive,
        txnId: uuid(),
      });
      return;
    }

    if (!hasDebtPermitSignature && needDebtPermitSignature) {
      approve({
        collateralChange: Decimal.ZERO,
        debtChange: borrowAmountDecimal.mul(isAddDebt ? 1 : -1),
        collateralToken: selectedCollateralToken,
        currentUserCollateral: collateralBalance,
        currentUserDebt: debtBalance,
        closePosition: closePositionActive,
        txnId: uuid(),
      });
      return;
    }

    borrow({
      collateralChange: collateralAmountDecimal.mul(isAddCollateral ? 1 : -1),
      debtChange: borrowAmountDecimal.mul(isAddDebt ? 1 : -1),
      collateralToken: selectedCollateralToken,
      currentUserCollateral: collateralBalance,
      currentUserDebt: debtBalance,
      closePosition: closePositionActive,
      txnId: uuid(),
      options: {
        collateralPermitSignature: tokenSignatureMap[selectedCollateralToken] ?? undefined,
        rPermitSignature: tokenSignatureMap[R_TOKEN] ?? undefined,
      },
    });
  }, [
    canAdjust,
    hasWhitelisted,
    hasEnoughCollateralAllowance,
    selectedCollateralToken,
    hasCollateralPermitSignature,
    needCollateralPermitSignature,
    hasDebtPermitSignature,
    needDebtPermitSignature,
    borrow,
    collateralAmountDecimal,
    isAddCollateral,
    borrowAmountDecimal,
    isAddDebt,
    collateralBalance,
    debtBalance,
    closePositionActive,
    tokenSignatureMap,
    whitelistDelegate,
    approve,
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
            !isPositionWithinCollateralPositionCap ||
            !isPositionWithinCollateralProtocolCap
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
          error={!hasMinBorrow || !hasMinNewRatio || !isPositionWithinDebtPositionCap}
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
        borrowingFeePercentageFormatted={borrowingFeePercentageFormatted}
        borrowingFeeAmountFormatted={borrowingFeeAmountFormatted}
      />
      <PositionAction
        actionButtonState={transactionState}
        canBorrow={canAdjust}
        buttonLabel={buttonLabel}
        walletConnected={true}
        onClick={onAction}
      />
    </div>
  );
};
export default AdjustPosition;
