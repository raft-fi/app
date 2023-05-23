import { useCallback, useEffect, useMemo, useState } from 'react';
import { Decimal, DecimalFormat } from '@tempusfinance/decimal';
import { v4 as uuid } from 'uuid';
import { useConnectWallet } from '@web3-onboard/react';
import { CollateralToken, MIN_COLLATERAL_RATIO, R_TOKEN } from '@raft-fi/sdk';
import {
  useWallet,
  useBorrow,
  useTokenPrices,
  useTokenBalances,
  useNetwork,
  useTokenAllowances,
  useTokenWhitelists,
  useApprove,
} from '../../hooks';
import {
  COLLATERAL_TOKEN_UI_PRECISION,
  DISPLAY_BASE_TOKEN,
  HEALTHY_RATIO,
  HEALTHY_RATIO_BUFFER,
  INPUT_PREVIEW_DIGITS,
  LIQUIDATION_UPPER_RATIO,
  MIN_BORROW_AMOUNT,
  R_TOKEN_UI_PRECISION,
  SUPPORTED_COLLATERAL_TOKENS,
  USD_UI_PRECISION,
} from '../../constants';
import { getCollateralRatioColor, getTokenValues, isCollateralToken } from '../../utils';
import {
  Button,
  CurrencyInput,
  ValuesBox,
  Typography,
  Icon,
  Loading,
  ValueLabel,
  TooltipWrapper,
  Tooltip,
} from '../shared';

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

  useEffect(() => {
    const rTokenPrice = tokenPriceMap[R_TOKEN];
    const collateralBalanceValid =
      tokenBalanceMap[selectedCollateralToken] && !tokenBalanceMap[selectedCollateralToken]?.isZero();
    const collateralPriceValid =
      tokenPriceMap[selectedCollateralToken] && !tokenPriceMap[selectedCollateralToken]?.isZero();

    // when input is not dirty, check whether price and balance are available
    if (!hasChanged && rTokenPrice && !rTokenPrice.isZero() && collateralPriceValid && MIN_COLLATERAL_RATIO.gt(0)) {
      const collateralBalance = tokenBalanceMap[selectedCollateralToken] as Decimal;
      const collateralPrice = tokenPriceMap[selectedCollateralToken] as Decimal;
      const minBorrowValue = rTokenPrice.mul(MIN_BORROW_AMOUNT);
      const minCollateral = minBorrowValue.mul(HEALTHY_RATIO).div(collateralPrice);
      // suggested amount = integer amount of collateral that is enough to borrow min amount of R
      const normalizedCollateral = new Decimal(minCollateral.toTruncated(0)).add(1);
      const normalizedBorrow = normalizedCollateral.mul(collateralPrice).div(rTokenPrice).div(HEALTHY_RATIO);

      if (!collateralBalanceValid || collateralBalance.gte(normalizedCollateral)) {
        // if balance >= suggested amount or balance not available
        //   fill input with suggested amount and corresponding R
        setCollateralAmount(normalizedCollateral.toTruncated(0));
        setBorrowAmount(normalizedBorrow.toString());
      } else {
        // if balance < suggested amount, fill input with balance and corresponding R
        const maxBorrow = collateralBalance.mul(collateralPrice).div(rTokenPrice).div(HEALTHY_RATIO);

        setCollateralAmount(collateralBalance.toString());
        setBorrowAmount(maxBorrow.toString());
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
      return new Decimal(0);
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
      baseTokenAmount && !baseTokenAmount.isZero()
        ? DecimalFormat.format(baseTokenAmount, {
            style: 'currency',
            currency: DISPLAY_BASE_TOKEN,
            fractionDigits: COLLATERAL_TOKEN_UI_PRECISION,
            lessThanFormat: true,
          })
        : 'N/A',
    [baseTokenAmount],
  );

  const liquidationPrice = useMemo(() => {
    if (!baseTokenAmount || !borrowAmount || baseTokenAmount.isZero()) {
      return null;
    }

    const borrowAmountDecimal = new Decimal(borrowAmount || 0);
    if (borrowAmountDecimal.lt(MIN_BORROW_AMOUNT)) {
      return null;
    }

    return borrowAmountDecimal.mul(LIQUIDATION_UPPER_RATIO).div(baseTokenAmount);
  }, [baseTokenAmount, borrowAmount]);
  const liquidationPriceFormatted = useMemo(
    () =>
      liquidationPrice
        ? `~${DecimalFormat.format(liquidationPrice, {
            style: 'currency',
            currency: '$',
            fractionDigits: USD_UI_PRECISION,
          })}`
        : 'N/A',
    [liquidationPrice],
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

  const collateralAmountWithEllipse = useMemo(() => {
    if (!collateralTokenValues.amount) {
      return null;
    }

    const original = collateralTokenValues.amount.toString();
    const truncated = collateralTokenValues.amount.toTruncated(INPUT_PREVIEW_DIGITS);

    return original === truncated ? original : `${truncated}...`;
  }, [collateralTokenValues.amount]);
  const borrowAmountWithEllipse = useMemo(() => {
    if (!borrowTokenValues.amount) {
      return null;
    }

    const original = borrowTokenValues.amount.toString();
    const truncated = borrowTokenValues.amount.toTruncated(INPUT_PREVIEW_DIGITS);

    return original === truncated ? original : `${truncated}...`;
  }, [borrowTokenValues.amount]);

  const minBorrowFormatted = useMemo(() => DecimalFormat.format(MIN_BORROW_AMOUNT, { style: 'decimal' }), []);
  const minRatioFormatted = useMemo(() => DecimalFormat.format(LIQUIDATION_UPPER_RATIO, { style: 'percentage' }), []);

  const walletConnected = useMemo(() => Boolean(wallet), [wallet]);

  const collateralRatioColor = useMemo(() => getCollateralRatioColor(collateralizationRatio), [collateralizationRatio]);
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

  const buttonLabel = useMemo(() => {
    if (!walletConnected) {
      return 'Connect wallet';
    }

    if (!hasEnoughCollateralTokenBalance) {
      return 'Insufficient funds';
    }

    if (!hasMinBorrow) {
      return `You need to borrow at least ${minBorrowFormatted} R`;
    }

    if (!hasMinRatio) {
      return 'Collateralization ratio is below the minimum threshold';
    }

    if (!hasWhitelisted) {
      return `Whitelist delegate (1/${executionSteps})`;
    }

    if (!hasEnoughCollateralAllowance) {
      return `Approve ${selectedCollateralToken} (1/${executionSteps})`;
    }

    return 'Borrow';
  }, [
    walletConnected,
    hasEnoughCollateralTokenBalance,
    hasMinBorrow,
    hasMinRatio,
    hasWhitelisted,
    hasEnoughCollateralAllowance,
    minBorrowFormatted,
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
    selectedCollateralToken,
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
    if (!approveStatus && !borrowStatus) {
      return;
    }

    if (approveStatus?.pending || borrowStatus?.pending) {
      setActionButtonState('loading');
    } else if (approveStatus?.success || borrowStatus?.success) {
      setActionButtonState('success');
    } else {
      setActionButtonState('default');
    }
  }, [approveStatus, borrowStatus]);

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
        <Typography variant="subtitle" weight="medium">
          Open Position
        </Typography>

        {walletConnected && (
          <Button variant="secondary" disabled={maxButtonDisabled} onClick={handleMaxButtonClick}>
            <Typography variant="body-primary" weight="medium">
              Max safe borrow
            </Typography>
          </Button>
        )}
      </div>
      <div className="raft__openPosition__input">
        <CurrencyInput
          label="Collateral"
          precision={18}
          fiatValue={collateralInputFiatValue}
          selectedToken={selectedCollateralToken}
          tokens={SUPPORTED_COLLATERAL_TOKENS}
          value={collateralAmount}
          maxAmount={selectedCollateralTokenBalanceValues.amount}
          maxAmountFormatted={selectedCollateralTokenBalanceValues.amountFormatted ?? undefined}
          previewValue={collateralAmountWithEllipse ?? undefined}
          onTokenUpdate={handleCollateralTokenChange}
          onValueUpdate={handleCollateralValueUpdate}
          onBlur={handleCollateralTokenBlur}
          error={!hasEnoughCollateralTokenBalance || !hasMinRatio}
        />
        <CurrencyInput
          label="Borrow"
          precision={18}
          fiatValue={borrowInputFiatValue}
          selectedToken={R_TOKEN}
          tokens={[R_TOKEN]}
          value={borrowAmount}
          maxAmount={rTokenBalance}
          maxAmountFormatted={rTokenBalanceFormatted ?? undefined}
          previewValue={borrowAmountWithEllipse ?? undefined}
          disableMaxAmountClick
          onValueUpdate={handleBorrowValueUpdate}
          onBlur={handleBorrowTokenBlur}
          error={!hasMinBorrow || !hasMinRatio}
        />
      </div>
      <div className="raft__openPosition__data">
        <ValuesBox
          values={[
            {
              id: 'collateral',
              label: (
                <>
                  <TooltipWrapper
                    tooltipContent={
                      <Tooltip className="raft__openPosition__infoTooltip">
                        <Typography className="raft__openPosition__infoTooltipText" variant="body-secondary">
                          The total collateral amount you will be depositing into Raft.
                        </Typography>
                      </Tooltip>
                    }
                    placement="left"
                  >
                    <Icon variant="info" size="small" />
                  </TooltipWrapper>
                  <Typography variant="body-primary">Total collateral&nbsp;</Typography>
                </>
              ),
              value: baseTokenAmountFormatted,
            },
            {
              id: 'debt',
              label: (
                <>
                  <TooltipWrapper
                    tooltipContent={
                      <Tooltip className="raft__openPosition__infoTooltip">
                        <Typography className="raft__openPosition__infoTooltipText" variant="body-secondary">
                          The total amount of R you will be borrowing from Raft using your collateral.
                        </Typography>
                      </Tooltip>
                    }
                    placement="left"
                  >
                    <Icon variant="info" size="small" />
                  </TooltipWrapper>
                  <Typography variant="body-primary">Total debt&nbsp;</Typography>
                  <Typography variant="body-tertiary">{`(Min. ${minBorrowFormatted}`}&nbsp;</Typography>
                  <Typography variant="body-tertiary" type="mono">
                    {R_TOKEN}
                  </Typography>
                  <Typography variant="body-tertiary">{')'}</Typography>
                </>
              ),
              value: hasMinBorrow ? (
                `${borrowTokenValues.amountFormatted ?? 'N/A'}`
              ) : (
                <TooltipWrapper
                  anchorClasses="raft__openPosition__error"
                  tooltipContent={
                    <Tooltip>
                      <Typography variant="body-tertiary" color="text-error">
                        Borrow below the minimum amount
                      </Typography>
                    </Tooltip>
                  }
                  placement="right"
                >
                  <ValueLabel value={`${borrowTokenValues.amountFormatted ?? 0}`} color="text-error" />
                  <Icon variant="error" size="small" />
                </TooltipWrapper>
              ),
            },
            {
              id: 'liquidationPrice',
              label: (
                <>
                  <TooltipWrapper
                    tooltipContent={
                      <Tooltip className="raft__openPosition__infoTooltip">
                        <Typography className="raft__openPosition__infoTooltipText" variant="body-secondary">
                          The price at which your position will be available to be liquidated. Learn more about
                          liquidations{' '}
                          <a href="https://docs.raft.fi/how-it-works/returning/liquidation" target="_blank">
                            here
                            <span>
                              <Icon variant="external-link" size={10} />
                            </span>
                          </a>
                        </Typography>
                      </Tooltip>
                    }
                    placement="left"
                  >
                    <Icon variant="info" size="small" />
                  </TooltipWrapper>
                  <Typography variant="body-primary">Collateral liquidation price&nbsp;</Typography>
                </>
              ),
              value: hasMinRatio ? liquidationPriceFormatted : 'N/A',
            },
            {
              id: 'collateralizationRatio',
              label: (
                <>
                  <TooltipWrapper
                    tooltipContent={
                      <Tooltip className="raft__openPosition__infoTooltip">
                        <Typography className="raft__openPosition__infoTooltipText" variant="body-secondary">
                          The percentage of R borrowed in relation to the total collateral amount.
                        </Typography>
                      </Tooltip>
                    }
                    placement="left"
                  >
                    <Icon variant="info" size="small" />
                  </TooltipWrapper>
                  <Typography variant="body-primary">Collateralization ratio&nbsp;</Typography>
                  <Typography variant="body-tertiary">{`(Min. ${minRatioFormatted})`}</Typography>
                </>
              ),
              value:
                hasMinRatio || collateralizationRatioFormatted === 'N/A' ? (
                  <ValueLabel color={collateralRatioColor} value={collateralizationRatioFormatted || 'N/A'} />
                ) : (
                  <TooltipWrapper
                    anchorClasses="raft__openPosition__error"
                    tooltipContent={
                      <Tooltip>
                        <Typography variant="body-tertiary" color="text-error">
                          Collateralization ratio is below the minimum threshold
                        </Typography>
                      </Tooltip>
                    }
                    placement="right"
                  >
                    <ValueLabel value={collateralizationRatioFormatted} color="text-error" />
                    <Icon variant="error" size="small" />
                  </TooltipWrapper>
                ),
            },
          ]}
        />
      </div>
      <div className="raft__openPosition__action">
        {isWrongNetwork ? (
          <Button
            className="raft__openPosition__action__wrongNetwork"
            variant="primary"
            onClick={switchToSupportedNetwork}
          >
            <Icon variant="error" />
            <Typography variant="body-primary" weight="bold" color="text-error">
              Unsupported network
            </Typography>
          </Button>
        ) : (
          <Button variant="primary" onClick={walletConnected ? onAction : onConnectWallet} disabled={buttonDisabled}>
            {actionButtonState === 'loading' && <Loading />}
            <Typography variant="body-primary" weight="medium" color="text-primary-inverted">
              {buttonLabel}
            </Typography>
          </Button>
        )}
      </div>
    </div>
  );
};
export default OpenPosition;
