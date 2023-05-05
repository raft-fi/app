import { useCallback, useEffect, useMemo, useState } from 'react';
import { Decimal, DecimalFormat } from 'tempus-decimal';
import { v4 as uuid } from 'uuid';
import { CollateralTokenType } from '@raft-fi/sdk';
import { useConnectWallet } from '@web3-onboard/react';
import { useWallet, useBorrow, useTokenPrices, useTokenBalances } from '../../hooks';
import {
  CollateralToken,
  COLLATERAL_TOKENS,
  DISPLAY_BASE_TOKEN,
  isCollateralToken,
  RAFT_TOKEN,
} from '../../interfaces';
import {
  COLLATERAL_TOKEN_UI_PRECISION,
  LIQUIDATION_UPPER_RATIO,
  MIN_BORROW_AMOUNT,
  R_TOKEN_UI_PRECISION,
  USD_UI_PRECISION,
} from '../../constants';
import { getTokenValues } from '../../utils';
import { Button, CurrencyInput, ValuesBox, Typography, Icon, Loading, ValueLabel } from '../shared';

import './OpenPosition.scss';
import { ButtonWrapper } from 'tempus-ui';

const OpenPosition = () => {
  const [, connect] = useConnectWallet();

  const tokenPriceMap = useTokenPrices();
  const tokenBalanceMap = useTokenBalances();
  const wallet = useWallet();
  const { borrow, borrowStatus } = useBorrow();

  const [selectedCollateralToken, setSelectedCollateralToken] = useState<CollateralToken>('wstETH');
  const [collateralAmount, setCollateralAmount] = useState<string>('');
  const [borrowAmount, setBorrowAmount] = useState<string>('');
  const [state, setState] = useState<string>('default');

  const collateralTokenValues = useMemo(
    () => getTokenValues(collateralAmount, tokenPriceMap[selectedCollateralToken], selectedCollateralToken),
    [collateralAmount, selectedCollateralToken, tokenPriceMap],
  );
  const borrowTokenValues = useMemo(
    () => getTokenValues(borrowAmount, tokenPriceMap[RAFT_TOKEN], RAFT_TOKEN),
    [borrowAmount, tokenPriceMap],
  );
  const baseTokenValues = useMemo(
    () => getTokenValues(borrowAmount, tokenPriceMap[DISPLAY_BASE_TOKEN], RAFT_TOKEN),
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
    if (collateralTokenValues.value === null || borrowTokenValues.value === null) {
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

  const rTokenBalance = useMemo(() => tokenBalanceMap[RAFT_TOKEN], [tokenBalanceMap]);
  const rTokenBalanceFormatted = useMemo(() => {
    if (!rTokenBalance) {
      return '';
    }

    return DecimalFormat.format(rTokenBalance, {
      style: 'currency',
      currency: RAFT_TOKEN,
      fractionDigits: R_TOKEN_UI_PRECISION,
      lessThanFormat: true,
    });
  }, [rTokenBalance]);

  const minBorrowFormatted = useMemo(() => DecimalFormat.format(MIN_BORROW_AMOUNT, { style: 'decimal' }), []);
  const minRatioFormatted = useMemo(() => DecimalFormat.format(LIQUIDATION_UPPER_RATIO, { style: 'percentage' }), []);

  const hasInputFilled = useMemo(
    () => collateralTokenValues.amount && borrowTokenValues.amount,
    [borrowTokenValues.amount, collateralTokenValues.amount],
  );
  const hasEnoughCollateralTokenBalance = useMemo(
    () =>
      !collateralTokenValues.amount ||
      Boolean(selectedCollateralTokenBalance && collateralTokenValues.amount.lte(selectedCollateralTokenBalance)),
    [collateralTokenValues.amount, selectedCollateralTokenBalance],
  );
  const hasMinBorrow = useMemo(
    () => !borrowTokenValues.amount || Boolean(borrowTokenValues.amount.gte(MIN_BORROW_AMOUNT)),
    [borrowTokenValues.amount],
  );
  const hasMinRatio = useMemo(
    () => !collateralizationRatio || Boolean(collateralizationRatio.gte(LIQUIDATION_UPPER_RATIO)),
    [collateralizationRatio],
  );
  const canBorrow = useMemo(
    () => hasInputFilled && hasEnoughCollateralTokenBalance && hasMinBorrow && hasMinRatio,
    [hasEnoughCollateralTokenBalance, hasInputFilled, hasMinBorrow, hasMinRatio],
  );

  const walletConnected = useMemo(() => {
    return Boolean(wallet);
  }, [wallet]);

  const buttonLabel = useMemo(() => {
    if (!walletConnected) {
      return 'Connect wallet';
    }

    if (!hasEnoughCollateralTokenBalance) {
      return 'Insufficient wallet balance';
    }

    if (!hasMinBorrow) {
      return 'Total debt below minimum';
    }

    if (!hasMinRatio) {
      return 'Collateralization ratio too low';
    }

    return 'Borrow';
  }, [hasEnoughCollateralTokenBalance, hasMinBorrow, hasMinRatio, walletConnected]);

  const onConnectWallet = useCallback(() => {
    connect();
  }, [connect]);

  const onBorrow = useCallback(() => {
    if (!canBorrow) {
      return;
    }

    let collateralTokenType: CollateralTokenType;
    switch (selectedCollateralToken) {
      // TODO - Once support for ETH and stETH collateral is added, uncomment the following lines
      /* case 'ETH':
        collateralTokenType = CollateralTokenType.ETH;
        break;
      case 'stETH':
        collateralTokenType = CollateralTokenType.STETH;
        break; */
      case 'wstETH':
        collateralTokenType = CollateralTokenType.WSTETH;
        break;
      default:
        throw new Error(`Unsupported collateral token type selected: ${selectedCollateralToken}`);
    }

    borrow({
      collateralAmount: new Decimal(collateralAmount),
      debtAmount: new Decimal(borrowAmount),
      collateralToken: collateralTokenType,
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

  /**
   * Update action button state based on current borrow request status
   */
  useEffect(() => {
    if (!borrowStatus) {
      return;
    }

    if (borrowStatus.pending) {
      setState('loading');
    } else if (borrowStatus.success) {
      // TODO - Open success modal with tx info
      setState('success');
    } else {
      setState('default');
    }
  }, [borrowStatus]);

  return (
    <div className="raft__openPosition">
      <div className="raft__openPosition__header">
        <Typography variant="subtitle" weight="medium">
          Open position
        </Typography>
      </div>
      <div className="raft__openPosition__input">
        <CurrencyInput
          label="Collateral"
          precision={18}
          fiatValue={collateralTokenValues.valueFormatted}
          selectedToken={selectedCollateralToken}
          tokens={[...COLLATERAL_TOKENS]}
          value={collateralAmount}
          maxAmount={selectedCollateralTokenBalanceFormatted}
          onTokenUpdate={handleCollateralTokenChange}
          onValueUpdate={setCollateralAmount}
          error={!hasEnoughCollateralTokenBalance || !hasMinRatio}
        />
        <CurrencyInput
          label="Borrow"
          precision={18}
          fiatValue={borrowTokenValues.valueFormatted}
          selectedToken={RAFT_TOKEN}
          tokens={[RAFT_TOKEN]}
          value={borrowAmount}
          maxAmount={rTokenBalanceFormatted}
          onValueUpdate={setBorrowAmount}
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
                    {RAFT_TOKEN}
                  </Typography>
                  <Typography variant="body-tertiary">{')'}</Typography>
                </>
              ),
              value: hasMinBorrow ? (
                `${borrowTokenValues.amountFormatted ?? 0} ${RAFT_TOKEN}`
              ) : (
                <ButtonWrapper className="raft__openPosition__error">
                  <ValueLabel value={`${borrowTokenValues.amountFormatted ?? 0} ${RAFT_TOKEN}`} />
                  <Icon variant="error" size="small" />
                </ButtonWrapper>
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
                  <ButtonWrapper className="raft__openPosition__error">
                    <ValueLabel value={collateralizationRatioFormatted} />
                    <Icon variant="error" size="small" />
                  </ButtonWrapper>
                ),
            },
          ]}
        />
      </div>
      <div className="raft__openPosition__action">
        <Button
          variant="primary"
          onClick={walletConnected ? onBorrow : onConnectWallet}
          disabled={state === 'loading' || !canBorrow}
        >
          {state === 'loading' && <Loading />}
          <Typography variant="body-primary" weight="bold" color="text-primary-inverted">
            {buttonLabel}
          </Typography>
        </Button>
      </div>
    </div>
  );
};
export default OpenPosition;
