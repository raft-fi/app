import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Decimal, DecimalFormat } from '@tempusfinance/decimal';
import { ButtonWrapper, Link, TokenLogo } from 'tempus-ui';
import { v4 as uuid } from 'uuid';
import {
  CollateralToken,
  ERC20PermitSignatureStruct,
  MIN_COLLATERAL_RATIO,
  R_TOKEN,
  Token,
  TOKENS,
  TOKENS_WITH_PERMIT,
} from '@raft-fi/sdk';
import {
  TokenAllowanceMap,
  TokenWhitelistMap,
  useApprove,
  useBorrow,
  useCollateralBorrowingRate,
  useProtocolStats,
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
  INPUT_PREVIEW_DIGITS,
  MINIMUM_UI_AMOUNT_FOR_BORROW_FEE,
  MIN_BORROW_AMOUNT,
  R_TOKEN_UI_PRECISION,
  SUPPORTED_COLLATERAL_TOKENS,
} from '../../constants';
import { Nullable } from '../../interfaces';
import { Button, CurrencyInput, Icon, Loading, Tooltip, TooltipWrapper, Typography, ValueLabel } from '../shared';

import './AdjustPosition.scss';

type TokenApprovedMap = {
  [token in Token]: Nullable<boolean>;
};

type TokenSignatureMap = {
  [token in Token]: Nullable<ERC20PermitSignatureStruct>;
};

interface AdjustPositionProps {
  collateralBalance: Decimal;
  debtBalance: Decimal;
}

const DEFAULT_MAP = TOKENS.reduce(
  (map, token) => ({
    ...map,
    [token]: null,
  }),
  {},
);

const AdjustPosition: FC<AdjustPositionProps> = ({ collateralBalance, debtBalance }) => {
  const { borrow, borrowStatus } = useBorrow();
  const { approve, approveStatus } = useApprove();
  const { whitelistDelegate, whitelistDelegateStatus } = useWhitelistDelegate();
  const tokenBalanceMap = useTokenBalances();
  const tokenPriceMap = useTokenPrices();
  const tokenAllowanceMap = useTokenAllowances();
  const tokenWhitelistMap = useTokenWhitelists();
  const borrowingRate = useCollateralBorrowingRate();
  const protocolStats = useProtocolStats();

  const [tokenWhitelistMapWhenLoaded, setTokenWhitelistMapWhenLoaded] = useState<TokenWhitelistMap>(
    DEFAULT_MAP as TokenWhitelistMap,
  );
  const [tokenAllowanceMapWhenLoaded, setTokenAllowanceMapWhenLoaded] = useState<TokenAllowanceMap>(
    DEFAULT_MAP as TokenAllowanceMap,
  );
  const [selectedCollateralToken, setSelectedCollateralToken] = useState<CollateralToken>('stETH');
  const [collateralAmount, setCollateralAmount] = useState<string>('');
  const [borrowAmount, setBorrowAmount] = useState<string>('');
  const [isAddCollateral, setIsAddCollateral] = useState<boolean>(true);
  const [isAddDebt, setIsAddDebt] = useState<boolean>(true);
  const [closePositionActive, setClosePositionActive] = useState<boolean>(false);
  const [transactionState, setTransactionState] = useState<string>('default');
  const [hasWhitelistProceeded, setHasWhitelistProceeded] = useState<boolean>(false);
  const [hasApprovalProceeded, setHasApprovalProceeded] = useState<TokenApprovedMap>(DEFAULT_MAP as TokenApprovedMap);
  const [tokenSignatureMap, setTokenSignatureMap] = useState<TokenSignatureMap>(DEFAULT_MAP as TokenSignatureMap);

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
        newValue = currentCollateralInDisplayToken.amount.add(collateralAmountDecimal.mul(isAddCollateral ? 1 : -1));
        break;
      case 'wstETH':
        newValue = currentCollateralTokenValues.value
          .add(collateralTokenInputValues.value.mul(isAddCollateral ? 1 : -1))
          .div(displayTokenTokenPrice);
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
    isAddCollateral,
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
    const newValue = debtBalance.add(borrowAmountDecimal.mul(isAddDebt ? 1 : -1));

    return getTokenValues(newValue, tokenPriceMap[R_TOKEN], R_TOKEN);
  }, [borrowAmountDecimal, debtBalance, isAddDebt, tokenPriceMap]);

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

    if (!collateralAmountInDisplayToken || !debtAmount || debtAmount.lte(0)) {
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
        ? DecimalFormat.format(newCollateralizationRatio, { style: 'percentage', fractionDigits: 2, pad: true })
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
  const hasNonNegativeDebt = useMemo(() => !newDebtTokenValues.amount?.lt(0), [newDebtTokenValues.amount]);

  const formattedMissingBorrowAmount = useMemo(() => {
    if (!tokenBalanceMap[R_TOKEN]) {
      return null;
    }

    const missingBorrowAmount = borrowAmountDecimal.sub(tokenBalanceMap[R_TOKEN]);
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
    () => TOKENS_WITH_PERMIT.has(selectedCollateralToken) && collateralAmountDecimal.gt(0),
    [collateralAmountDecimal, selectedCollateralToken],
  );
  const needDebtPermitSignature = useMemo(
    () => !TOKENS_WITH_PERMIT.has(selectedCollateralToken) && !isAddDebt,
    [isAddDebt, selectedCollateralToken],
  );
  const hasEnoughToWithdraw = useMemo(() => {
    if (!newCollateralInDisplayToken.amount) {
      return true;
    }

    return newCollateralInDisplayToken.amount.gte(0);
  }, [newCollateralInDisplayToken.amount]);

  const isOverMaxBorrow = useMemo(() => {
    // In case user is repaying his debt, we should ignore max borrow limit
    if (!isAddDebt) {
      return false;
    }

    /**
     * Do not show error if user did not input anything.
     */
    if (!borrowAmount) {
      return false;
    }

    if (!protocolStats?.debtSupply || !newDebtTokenValues.amount) {
      return true;
    }

    /**
     * Total debt of protocol, excluding current user's debt
     */
    const totalDebt = protocolStats.debtSupply.sub(debtBalance);

    const maxBorrowAmount = totalDebt.div(10);
    if (newDebtTokenValues.amount.gt(maxBorrowAmount)) {
      return true;
    }
    return false;
  }, [newDebtTokenValues.amount, protocolStats?.debtSupply, debtBalance, borrowAmount, isAddDebt]);

  const canAdjust = useMemo(
    () =>
      isInputNonEmpty &&
      hasEnoughCollateralTokenBalance &&
      hasEnoughDebtTokenBalance &&
      hasMinBorrow &&
      hasMinNewRatio &&
      !isOverMaxBorrow,
    [
      isInputNonEmpty,
      hasEnoughCollateralTokenBalance,
      hasEnoughDebtTokenBalance,
      hasMinBorrow,
      hasMinNewRatio,
      isOverMaxBorrow,
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
    } else if (collateralAmountDecimal.gt(0)) {
      // input > zero, collateralPermitStep = 1
      collateralPermitStep = 1;
    }

    let debtPermitStep = 0;

    if (TOKENS_WITH_PERMIT.has(selectedCollateralToken)) {
      // token with permit, no need to permit R, debtPermitStep = 0
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
    } else if (tokenSignatureMap[R_TOKEN]) {
      // user has proceeded approve for R, debtPermitStep = 1
      debtPermitStep = 1;
    }

    const executionStep = 1;

    return whitelistStep + collateralApprovalStep + collateralPermitStep + debtPermitStep + executionStep;
  }, [
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

    if (!hasEnoughToWithdraw) {
      return 'Collateral amount to withdraw larger than current balance';
    }

    if (!hasMinNewRatio) {
      return 'Collateralization ratio is below the minimum threshold';
    }
  }, [hasEnoughCollateralTokenBalance, hasEnoughToWithdraw, hasMinNewRatio]);

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

    if (isOverMaxBorrow) {
      return 'Amount exceeds maximum debt allowed per Position';
    }
  }, [hasMinBorrow, hasMinNewRatio, hasNonNegativeDebt, isOverMaxBorrow]);

  const buttonLabel = useMemo(() => {
    // data not yet loaded will set executionSteps = 1, always show "Execution"
    if (executionSteps === 1) {
      return borrowStatus?.pending ? 'Executing' : 'Execute';
    }

    if (!hasEnoughDebtTokenBalance && hasNonNegativeDebt) {
      return `You need ${formattedMissingBorrowAmount} more R to close your Position`;
    }

    if (!hasWhitelisted) {
      return whitelistDelegateStatus?.pending
        ? `Whitelisting stETH (${executedSteps}/${executionSteps})`
        : `Whitelist stETH (${executedSteps}/${executionSteps})`;
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
    executionSteps,
    formattedMissingBorrowAmount,
    whitelistDelegateStatus?.pending,
    approveStatus?.pending,
  ]);

  const buttonDisabled = useMemo(() => transactionState === 'loading' || !canAdjust, [canAdjust, transactionState]);

  const borrowingFeeAmount = useMemo(() => {
    if (!borrowingRate) {
      return null;
    }

    return borrowAmountDecimal.mul(borrowingRate);
  }, [borrowAmountDecimal, borrowingRate]);

  const borrowingFeeAmountFormatted = useMemo(() => {
    if (!borrowingFeeAmount) {
      return null;
    }

    if (borrowAmountDecimal.isZero() || !isAddDebt) {
      return 'Free';
    }

    const borrowingFeeAmountFormatted = DecimalFormat.format(borrowingFeeAmount, {
      style: 'currency',
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
  }, [borrowAmountDecimal, borrowingFeeAmount, isAddDebt]);

  const onToggleClosePosition = useCallback(() => {
    if (!closePositionActive) {
      if (selectedCollateralToken === COLLATERAL_BASE_TOKEN) {
        setCollateralAmount(collateralBalance.toString());
        setIsAddCollateral(false);
      } else {
        const selectedCollateralTokenPrice = tokenPriceMap[selectedCollateralToken];

        if (
          currentCollateralTokenValues.value &&
          selectedCollateralTokenPrice &&
          !selectedCollateralTokenPrice.isZero()
        ) {
          const collateralBalanceInSelectedCollateralToken =
            currentCollateralTokenValues.value.div(selectedCollateralTokenPrice);
          setCollateralAmount(collateralBalanceInSelectedCollateralToken.toString());
          setIsAddCollateral(false);
        }
      }

      setBorrowAmount(debtBalance.toString());
      setIsAddDebt(false);
    } else if (collateralBalance && debtBalance) {
      setCollateralAmount('0');
      setBorrowAmount('0');
      setIsAddCollateral(true);
      setIsAddDebt(true);
    }

    setClosePositionActive(prevState => !prevState);
  }, [
    closePositionActive,
    collateralBalance,
    currentCollateralTokenValues.value,
    debtBalance,
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
          tokens={SUPPORTED_COLLATERAL_TOKENS}
          value={collateralAmount}
          previewValue={collateralAmountWithEllipse}
          onTokenUpdate={handleCollateralTokenChange}
          onValueUpdate={setCollateralAmount}
          disabled={closePositionActive}
          onBlur={handleCollateralAmountBlur}
          error={!hasEnoughCollateralTokenBalance || !hasMinNewRatio || !hasEnoughToWithdraw}
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
          error={!hasMinBorrow || !hasMinNewRatio || isOverMaxBorrow}
          errorMsg={debtErrorMsg}
          maxIntegralDigits={10}
        />
      </div>
      <div className="raft__adjustPosition__data">
        <div className="raft__adjustPosition__data__position">
          <div className="raft__adjustPosition__data__position__title">
            <Typography variant="overline">POSITION AFTER</Typography>
            <TooltipWrapper
              tooltipContent={
                <Tooltip className="raft__adjustPosition__infoTooltip">
                  <Typography variant="body2">
                    Summary of your position after the transaction is executed.{' '}
                    <Link href="https://docs.raft.fi/how-it-works/borrowing">
                      Docs <Icon variant="external-link" size={10} />
                    </Link>
                  </Typography>
                </Tooltip>
              }
              placement="top"
            >
              <Icon variant="info" size="tiny" />
            </TooltipWrapper>
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
                value={
                  newDebtTokenValues.amountFormatted && newDebtTokenValues.amount?.gt(0)
                    ? newDebtTokenValues.amountFormatted
                    : `0.00 ${R_TOKEN}`
                }
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
                  className={`raft__adjustPosition__data__position__data__ratio__status status-risk-${newCollateralRatioLevel}`}
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
            <TooltipWrapper
              tooltipContent={
                <Tooltip className="raft__adjustPosition__infoTooltip">
                  <Typography variant="body2">
                    Borrowing fees associated with your transaction. Read the docs for more information.{' '}
                    <Link href="https://docs.raft.fi/how-it-works/borrowing">
                      Docs <Icon variant="external-link" size={10} />
                    </Link>
                  </Typography>
                </Tooltip>
              }
              placement="top"
            >
              <Icon variant="info" size="tiny" />
            </TooltipWrapper>
          </div>
          <div className="raft__adjustPosition__data__protocol-fee__value">
            <ValueLabel
              value={borrowingFeeAmountFormatted ?? `0.00 ${R_TOKEN}`}
              valueSize="body"
              tickerSize="caption"
            />
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
