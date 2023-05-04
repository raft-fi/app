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
} from '../../constants';
import { Button, CurrencyInput, ValuesBox, Typography, Icon, Loading } from '../shared';

import './OpenPosition.scss';

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

  const collateralTokenPrice = useMemo(
    () => tokenPriceMap[selectedCollateralToken],
    [selectedCollateralToken, tokenPriceMap],
  );
  const collateralTokenValue = useMemo(
    () => (collateralTokenPrice ? new Decimal(collateralAmount || 0).mul(collateralTokenPrice) : null),
    [collateralAmount, collateralTokenPrice],
  );
  const collateralTokenValueFormatted = useMemo(
    () =>
      collateralTokenValue
        ? `~${DecimalFormat.format(collateralTokenValue, { style: 'currency', currency: '$', fractionDigits: 2 })}`
        : null,
    [collateralTokenValue],
  );

  const borrowTokenPrice = useMemo(() => tokenPriceMap[RAFT_TOKEN], [tokenPriceMap]);
  const borrowTokenValue = useMemo(
    () => (borrowTokenPrice ? new Decimal(borrowAmount || 0).mul(borrowTokenPrice) : null),
    [borrowAmount, borrowTokenPrice],
  );
  const borrowTokenAmountFormatted = useMemo(
    () => DecimalFormat.format(borrowAmount || 0, { style: 'decimal', fractionDigits: 2 }),
    [borrowAmount],
  );
  const borrowTokenValueFormatted = useMemo(
    () =>
      borrowTokenValue
        ? `~${DecimalFormat.format(borrowTokenValue, { style: 'currency', currency: '$', fractionDigits: 2 })}`
        : null,
    [borrowTokenValue],
  );

  const baseTokenPrice = useMemo(() => tokenPriceMap[DISPLAY_BASE_TOKEN], [tokenPriceMap]);
  const baseTokenAmount = useMemo(() => {
    if (!collateralAmount) {
      return new Decimal(0);
    }

    const collateralAmountDecimal = new Decimal(collateralAmount);

    switch (selectedCollateralToken) {
      case 'ETH':
      case 'stETH':
      default:
        return collateralAmountDecimal;
      case 'wstETH':
        if (!collateralTokenPrice || !baseTokenPrice || baseTokenPrice.isZero()) {
          return null;
        }

        return collateralTokenPrice.mul(collateralAmountDecimal).div(baseTokenPrice);
    }
  }, [baseTokenPrice, collateralAmount, collateralTokenPrice, selectedCollateralToken]);
  const baseTokenAmountFormatted = useMemo(
    () => (baseTokenAmount ? DecimalFormat.format(baseTokenAmount, { style: 'decimal', fractionDigits: 4 }) : 'N/A'),
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
        ? `~${DecimalFormat.format(liquidationPrice, { style: 'currency', currency: '$', fractionDigits: 2 })}`
        : 'N/A',
    [liquidationPrice],
  );

  const collateralizationRatio = useMemo(() => {
    if (collateralTokenValue === null || borrowTokenValue === null) {
      return null;
    }

    const borrowAmountDecimal = new Decimal(borrowAmount || 0);
    if (borrowAmountDecimal.lt(MIN_BORROW_AMOUNT)) {
      return null;
    }

    return collateralTokenValue.div(borrowTokenValue);
  }, [borrowAmount, borrowTokenValue, collateralTokenValue]);
  const collateralizationRatioFormatted = useMemo(
    () =>
      collateralizationRatio
        ? DecimalFormat.format(collateralizationRatio, { style: 'percentage', fractionDigits: 2 })
        : 'N/A',
    [collateralizationRatio],
  );

  const minBorrowFormatted = useMemo(
    () => DecimalFormat.format(MIN_BORROW_AMOUNT, { style: 'currency', currency: '$' }),
    [],
  );
  const minRatioFormatted = useMemo(() => DecimalFormat.format(LIQUIDATION_UPPER_RATIO, { style: 'percentage' }), []);

  const walletConnected = useMemo(() => {
    return Boolean(wallet);
  }, [wallet]);

  const onConnectWallet = useCallback(() => {
    connect();
  }, [connect]);

  const onBorrow = useCallback(() => {
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
  }, [borrow, borrowAmount, collateralAmount, selectedCollateralToken]);

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

  const selectedCollateralTokenBalance = useMemo(() => {
    return tokenBalanceMap[selectedCollateralToken];
  }, [selectedCollateralToken, tokenBalanceMap]);

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

  const rTokenBalance = useMemo(() => {
    return tokenBalanceMap[RAFT_TOKEN];
  }, [tokenBalanceMap]);

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

  return (
    <div className="raft__openPosition">
      <div className="raft__openPosition__header">
        <Typography variant="subtitle" weight="medium">
          Open position
        </Typography>
      </div>
      <div className="raft__openPosition__input">
        {/* TODO - Replace hardcoded values with contract values */}
        <CurrencyInput
          label="Collateral"
          precision={18}
          fiatValue={collateralTokenValueFormatted}
          selectedToken={selectedCollateralToken}
          tokens={[...COLLATERAL_TOKENS]}
          value={collateralAmount}
          maxAmount={selectedCollateralTokenBalanceFormatted}
          onTokenUpdate={handleCollateralTokenChange}
          onValueUpdate={setCollateralAmount}
        />
        {/* TODO - Replace hardcoded values with contract values */}
        <CurrencyInput
          label="Borrow"
          precision={18}
          fiatValue={borrowTokenValueFormatted}
          selectedToken={RAFT_TOKEN}
          tokens={[RAFT_TOKEN]}
          value={borrowAmount}
          maxAmount={rTokenBalanceFormatted}
          onValueUpdate={setBorrowAmount}
        />
      </div>
      <div className="raft__openPosition__data">
        {/* TODO - Replace hardcoded values with values from contracts */}
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
              value: `${borrowTokenAmountFormatted} ${RAFT_TOKEN}`,
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
              value: collateralizationRatioFormatted,
            },
          ]}
        />
      </div>
      <div className="raft__openPosition__action">
        <Button variant="primary" onClick={walletConnected ? onBorrow : onConnectWallet} disabled={state === 'loading'}>
          {state === 'loading' && <Loading />}
          <Typography variant="body-primary" weight="bold" color="text-primary-inverted">
            {walletConnected ? 'Borrow' : 'Connect wallet'}
          </Typography>
        </Button>
      </div>
    </div>
  );
};
export default OpenPosition;
