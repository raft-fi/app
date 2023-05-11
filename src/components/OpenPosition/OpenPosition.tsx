import { useCallback, useEffect, useMemo, useState } from 'react';
import { Decimal, DecimalFormat } from '@tempusfinance/decimal';
import { Link } from 'tempus-ui';
import { v4 as uuid } from 'uuid';
import { useConnectWallet } from '@web3-onboard/react';
import { COLLATERAL_TOKENS, CollateralToken, R_TOKEN } from '@raft-fi/sdk';
import { useWallet, useBorrow, useTokenPrices, useTokenBalances } from '../../hooks';
import {
  COLLATERAL_TOKEN_UI_PRECISION,
  DISPLAY_BASE_TOKEN,
  GITBOOK_URL,
  HEALTHY_RATIO,
  LIQUIDATION_UPPER_RATIO,
  MIN_BORROW_AMOUNT,
  R_TOKEN_UI_PRECISION,
  USD_UI_PRECISION,
} from '../../constants';
import { getTokenValues, isCollateralToken } from '../../utils';
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

  const tokenPriceMap = useTokenPrices();
  const tokenBalanceMap = useTokenBalances();
  const wallet = useWallet();
  const { borrow, borrowStatus } = useBorrow();

  const [selectedCollateralToken, setSelectedCollateralToken] = useState<CollateralToken>('stETH');
  const [collateralAmount, setCollateralAmount] = useState<string>('');
  const [borrowAmount, setBorrowAmount] = useState<string>('');
  const [actionButtonState, setActionButtonState] = useState<string>('default');
  const [maxButtonDisabled, setMaxButtonDisabled] = useState<boolean>(false);

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
      baseTokenAmount
        ? DecimalFormat.format(baseTokenAmount, { style: 'decimal', fractionDigits: COLLATERAL_TOKEN_UI_PRECISION })
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

  const selectedCollateralTokenBalance = useMemo(
    () => tokenBalanceMap[selectedCollateralToken],
    [selectedCollateralToken, tokenBalanceMap],
  );
  const selectedCollateralTokenBalanceFormatted = useMemo(() => {
    if (!selectedCollateralTokenBalance) {
      return '';
    }

    return DecimalFormat.format(selectedCollateralTokenBalance, {
      style: 'currency',
      currency: selectedCollateralToken,
      fractionDigits: COLLATERAL_TOKEN_UI_PRECISION,
      lessThanFormat: true,
    });
  }, [selectedCollateralToken, selectedCollateralTokenBalance]);

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
  const minRatioFormatted = useMemo(() => DecimalFormat.format(LIQUIDATION_UPPER_RATIO, { style: 'percentage' }), []);

  const walletConnected = useMemo(() => Boolean(wallet), [wallet]);

  const hasInputFilled = useMemo(
    () => collateralTokenValues.amount && borrowTokenValues.amount,
    [borrowTokenValues.amount, collateralTokenValues.amount],
  );
  const hasEnoughCollateralTokenBalance = useMemo(
    () =>
      !walletConnected ||
      !collateralTokenValues.amount ||
      Boolean(selectedCollateralTokenBalance && collateralTokenValues.amount.lte(selectedCollateralTokenBalance)),
    [collateralTokenValues.amount, selectedCollateralTokenBalance, walletConnected],
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

  const buttonLabel = useMemo(() => {
    if (!walletConnected) {
      return 'Connect wallet';
    }

    if (!hasEnoughCollateralTokenBalance) {
      return 'Insufficient funds';
    }

    if (!hasMinBorrow) {
      return 'Borrow below the minimum amount';
    }

    if (!hasMinRatio) {
      return 'Collateralization ratio below the minimum threshold';
    }

    return 'Borrow';
  }, [hasEnoughCollateralTokenBalance, hasMinBorrow, hasMinRatio, walletConnected]);

  const buttonDisabled = useMemo(
    () => actionButtonState === 'loading' || (walletConnected && !canBorrow),
    [canBorrow, actionButtonState, walletConnected],
  );

  const onConnectWallet = useCallback(() => {
    connect();
  }, [connect]);

  const onBorrow = useCallback(() => {
    if (!canBorrow) {
      return;
    }

    borrow({
      collateralChange: new Decimal(collateralAmount),
      debtChange: new Decimal(borrowAmount),
      collateralToken: selectedCollateralToken,
      currentUserCollateral: new Decimal(0), // Always zero when user is 'Opening' a position
      currentUserDebt: new Decimal(0), // Always zero when user is 'Opening' a position
      txnId: uuid(),
    });
  }, [borrow, borrowAmount, canBorrow, collateralAmount, selectedCollateralToken]);

  const handleCollateralTokenChange = useCallback((token: string) => {
    if (isCollateralToken(token)) {
      setSelectedCollateralToken(token);
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

    // default collateral = 150% of borrow value
    const defaultBorrowAmount = collateralTokenValues.value.div(borrowTokenPrice).div(HEALTHY_RATIO).toTruncated(4);
    setBorrowAmount(defaultBorrowAmount);
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

    // default collateral = 150% of borrow value
    const defaultCollateralAmount = borrowTokenValues.value.mul(HEALTHY_RATIO).div(collateralTokenPrice).toTruncated(4);
    setCollateralAmount(defaultCollateralAmount);
  }, [borrowTokenValues.value, collateralTokenValues.amount, selectedCollateralToken, tokenPriceMap]);

  /**
   * Update action button state based on current borrow request status
   */
  useEffect(() => {
    if (!borrowStatus) {
      return;
    }

    if (borrowStatus.pending) {
      setActionButtonState('loading');
    } else if (borrowStatus.success) {
      setActionButtonState('success');
    } else {
      setActionButtonState('default');
    }
  }, [borrowStatus]);

  const collateralInputFiatValue = useMemo(() => {
    if (!collateralTokenValues.valueFormatted || Decimal.parse(collateralAmount, 0).isZero()) {
      return '$0.00';
    }

    return `~${collateralTokenValues.valueFormatted}`;
  }, [collateralTokenValues.valueFormatted, collateralAmount]);

  const borrowInputFiatValue = useMemo(() => {
    if (!borrowTokenValues.valueFormatted || Decimal.parse(borrowAmount, 0).isZero()) {
      return '$0.00';
    }

    return `~${borrowTokenValues.valueFormatted}`;
  }, [borrowTokenValues.valueFormatted, borrowAmount]);

  const handleMaxButtonClick = useCallback(() => {
    if (selectedCollateralTokenBalance && selectedCollateralTokenBalance.gt(Decimal.ZERO)) {
      setMaxButtonDisabled(true);
      setCollateralAmount(selectedCollateralTokenBalance.toString());
    }
  }, [selectedCollateralTokenBalance]);

  const handleCollateralValueUpdate = useCallback((amount: string) => {
    setMaxButtonDisabled(false);
    setCollateralAmount(amount);
  }, []);

  useEffect(() => {
    const borrowTokenPrice = tokenPriceMap[R_TOKEN];

    if (maxButtonDisabled && borrowTokenPrice && collateralTokenValues) {
      const defaultBorrowAmount = collateralTokenValues.value?.div(borrowTokenPrice).div(HEALTHY_RATIO).toTruncated(4);

      if (defaultBorrowAmount) {
        setBorrowAmount(defaultBorrowAmount);
      }
    }
  }, [maxButtonDisabled, collateralTokenValues, tokenPriceMap]);

  return (
    <div className="raft__openPosition">
      <div className="raft__openPosition__header">
        <Typography variant="subtitle" weight="medium">
          Open position
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
          tokens={[...COLLATERAL_TOKENS]}
          value={collateralAmount}
          maxAmount={selectedCollateralTokenBalanceFormatted}
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
          maxAmount={rTokenBalanceFormatted}
          onValueUpdate={setBorrowAmount}
          onBlur={handleBorrowTokenBlur}
          error={!hasMinBorrow || !hasMinRatio}
        />
      </div>
      {selectedCollateralToken === 'ETH' && (
        <div className="raft__openPosition__warning">
          <Icon variant="error" size="small" />
          <Typography variant="body-tertiary">
            ETH is converted to stETH and withdrawals are available in stETH or wstETH. You can read more about
            withdrawals&nbsp;
            <Link href={`${GITBOOK_URL}/how-it-works/position`}>
              in Docs
              <Icon variant="external-link" size="tiny" />
            </Link>
          </Typography>
        </div>
      )}
      <div className="raft__openPosition__data">
        <ValuesBox
          values={[
            {
              id: 'collateral',
              label: (
                <>
                  <Icon variant="info" size="small" />
                  <Typography variant="body-primary">Total collateral&nbsp;</Typography>
                </>
              ),
              value: `${baseTokenAmountFormatted} ${DISPLAY_BASE_TOKEN}`,
            },
            {
              id: 'debt',
              label: (
                <>
                  <Icon variant="info" size="small" />
                  <Typography variant="body-primary">Total debt&nbsp;</Typography>
                  <Typography variant="body-tertiary">{`(Min. ${minBorrowFormatted}`}&nbsp;</Typography>
                  <Typography variant="body-tertiary" type="mono">
                    {R_TOKEN}
                  </Typography>
                  <Typography variant="body-tertiary">{')'}</Typography>
                </>
              ),
              value: hasMinBorrow ? (
                `${borrowTokenValues.amountFormatted ?? 0}`
              ) : (
                <TooltipWrapper
                  anchorClasses="raft__openPosition__error"
                  tooltipContent={
                    <Tooltip className="raft__openPosition__tooltip__error">
                      <Typography variant="body-tertiary">Borrow below the minimum amount</Typography>
                    </Tooltip>
                  }
                  placement="right"
                >
                  <ValueLabel value={`${borrowTokenValues.amountFormatted ?? 0}`} />
                  <Icon variant="error" size="small" />
                </TooltipWrapper>
              ),
            },
            {
              id: 'liquidationPrice',
              label: (
                <>
                  <Icon variant="info" size="small" />
                  <Typography variant="body-primary">Collateral liquidation price&nbsp;</Typography>
                </>
              ),
              value: liquidationPriceFormatted,
            },
            {
              id: 'collateralizationRatio',
              label: (
                <>
                  <Icon variant="info" size="small" />
                  <Typography variant="body-primary">Collateralization ratio&nbsp;</Typography>
                  <Typography variant="body-tertiary">{`(Min. ${minRatioFormatted})`}</Typography>
                </>
              ),
              value:
                hasMinRatio || collateralizationRatioFormatted === 'N/A' ? (
                  collateralizationRatioFormatted
                ) : (
                  <TooltipWrapper
                    anchorClasses="raft__openPosition__error"
                    tooltipContent={
                      <Tooltip className="raft__openPosition__tooltip__error">
                        <Typography variant="body-tertiary">
                          Collateralization ratio below the minimum threshold
                        </Typography>
                      </Tooltip>
                    }
                    placement="right"
                  >
                    <ValueLabel value={collateralizationRatioFormatted} />
                    <Icon variant="error" size="small" />
                  </TooltipWrapper>
                ),
            },
          ]}
        />
      </div>
      <div className="raft__openPosition__action">
        <Button variant="primary" onClick={walletConnected ? onBorrow : onConnectWallet} disabled={buttonDisabled}>
          {actionButtonState === 'loading' && <Loading />}
          <Typography variant="body-primary" weight="bold" color="text-primary-inverted">
            {buttonLabel}
          </Typography>
        </Button>
      </div>
    </div>
  );
};
export default OpenPosition;
