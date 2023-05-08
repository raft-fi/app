import { useCallback, useEffect, useMemo, useState } from 'react';
import { resetBorrowStatus, useBorrow, useTokenPrices } from '../../hooks';
import TransactionSuccessModal from './TransactionSuccessModal';
import TransactionFailedModal from './TransactionFailedModal';
import { Decimal, DecimalFormat } from 'tempus-decimal';
import { ValueLabel } from '../shared';
import { COLLATERAL_BASE_TOKEN, CollateralToken, DISPLAY_BASE_TOKEN, RAFT_TOKEN } from '../../interfaces';
import { COLLATERAL_TOKEN_UI_PRECISION, R_TOKEN_UI_PRECISION } from '../../constants';
import { CollateralTokenType } from '@raft-fi/sdk';

const TransactionModal = () => {
  const { borrowStatus } = useBorrow();
  const tokenPriceMap = useTokenPrices();

  const [successModalOpened, setSuccessModalOpened] = useState<boolean>(false);
  const [failedModalOpened, setFailedModalOpened] = useState<boolean>(false);

  /**
   * Display success/failed modals based on borrow status - if you want to close the modal, use resetBorrowStatus()
   */
  useEffect(() => {
    if (!borrowStatus) {
      setSuccessModalOpened(false);
      setFailedModalOpened(false);
      return;
    }

    if (borrowStatus.success) {
      setSuccessModalOpened(true);
    }
    if (borrowStatus.error) {
      setFailedModalOpened(true);
    }
  }, [borrowStatus]);

  const onCloseModal = useCallback(() => {
    // By resetting the borrow status we can close the modal
    resetBorrowStatus();
  }, []);

  const onRetryTransaction = useCallback(() => {
    // TODO - Implement retry logic
  }, []);

  const debtChange = useMemo(() => {
    if (!borrowStatus) {
      return null;
    }

    return borrowStatus.request.debtAmount.sub(borrowStatus.request.currentUserDebt);
  }, [borrowStatus]);

  /**
   *  TODO - Remove this token type conversion when SDK types are in sync with app types
   */
  const collateralToken = useMemo(() => {
    if (!borrowStatus) {
      return null;
    }

    let collateralToken: CollateralToken;
    switch (borrowStatus.request.collateralToken) {
      // TODO - Once support for ETH and stETH collateral is added, uncomment the following lines
      /* case 'ETH':
              collateralTokenType = CollateralTokenType.ETH;
              break;
            case 'stETH':
              collateralTokenType = CollateralTokenType.STETH;
              break; */
      case CollateralTokenType.WSTETH:
        collateralToken = 'wstETH';
        break;
      default:
        throw new Error(`Unsupported collateral token type: ${borrowStatus.request.collateralToken}`);
    }

    return collateralToken;
  }, [borrowStatus]);

  const collateralChange = useMemo(() => {
    if (!borrowStatus) {
      return null;
    }

    return borrowStatus.request.collateralAmount.sub(borrowStatus.request.currentUserCollateral);
  }, [borrowStatus]);

  /**
   * Generate success modal title based on borrow request params
   */
  const successModalTitle = useMemo(() => {
    if (!borrowStatus || !debtChange || !collateralChange || !collateralToken) {
      return '';
    }

    let debtLabel: string;
    let collateralLabel: string;

    if (debtChange.lt(Decimal.ZERO)) {
      debtLabel = 'repayment';
    } else {
      debtLabel = 'borrow';
    }

    if (collateralChange.lt(Decimal.ZERO)) {
      collateralLabel = 'withdrawal';
    } else {
      collateralLabel = 'deposit';
    }

    const debtValueFormatted = DecimalFormat.format(debtChange.abs(), {
      style: 'currency',
      currency: RAFT_TOKEN,
      fractionDigits: R_TOKEN_UI_PRECISION,
      lessThanFormat: true,
    });

    const collateralBaseTokenPrice = tokenPriceMap[COLLATERAL_BASE_TOKEN];
    if (!collateralBaseTokenPrice) {
      return null;
    }

    const displayBaseTokenPrice = tokenPriceMap[DISPLAY_BASE_TOKEN];
    if (!displayBaseTokenPrice) {
      return null;
    }

    const collateralInDisplayToken = collateralBaseTokenPrice.mul(collateralChange.abs()).div(displayBaseTokenPrice);

    const collateralValueFormatted = DecimalFormat.format(collateralInDisplayToken, {
      style: 'currency',
      currency: collateralToken,
      fractionDigits: COLLATERAL_TOKEN_UI_PRECISION,
      lessThanFormat: true,
    });

    return (
      <>
        {!debtChange.isZero() && (
          <ValueLabel
            value={debtValueFormatted}
            label={!collateralChange.isZero() ? debtLabel : ''}
            valueSize="subheader"
            tickerSize="subheader"
          />
        )}
        {!collateralChange.isZero() && (
          <ValueLabel
            value={collateralValueFormatted}
            label={!debtChange.isZero() ? collateralLabel : ''}
            valueSize="subheader"
            tickerSize="subheader"
          />
        )}
      </>
    );
  }, [borrowStatus, collateralChange, collateralToken, debtChange, tokenPriceMap]);

  /**
   * Generate success modal subtitle based on borrow request params
   */
  const successModalSubtitle = useMemo(() => {
    if (!borrowStatus || !debtChange || !collateralChange) {
      return '';
    }

    if (collateralChange.lt(Decimal.ZERO) && debtChange.equals(Decimal.ZERO)) {
      return 'Successful withdrawal';
    }
    if (collateralChange.equals(Decimal.ZERO) && debtChange.lt(Decimal.ZERO)) {
      return 'Successful repayment';
    }
    if (collateralChange.gt(Decimal.ZERO) && debtChange.equals(Decimal.ZERO)) {
      return 'Successful deposit';
    }
    if (collateralChange.equals(Decimal.ZERO) && debtChange.gt(Decimal.ZERO)) {
      return 'Successful borrow';
    }

    return 'Successful transaction';
  }, [borrowStatus, collateralChange, debtChange]);

  const collateralAfterTx = useMemo(() => {
    if (!borrowStatus || !collateralToken) {
      return null;
    }

    const collateralBaseTokenPrice = tokenPriceMap[COLLATERAL_BASE_TOKEN];
    if (!collateralBaseTokenPrice) {
      return null;
    }

    const displayBaseTokenPrice = tokenPriceMap[DISPLAY_BASE_TOKEN];
    if (!displayBaseTokenPrice) {
      return null;
    }

    const amount = collateralBaseTokenPrice.mul(borrowStatus.request.collateralAmount).div(displayBaseTokenPrice);

    return DecimalFormat.format(amount, {
      style: 'currency',
      currency: collateralToken,
      fractionDigits: COLLATERAL_TOKEN_UI_PRECISION,
      lessThanFormat: true,
    });
  }, [borrowStatus, collateralToken, tokenPriceMap]);

  const debtAfterTx = useMemo(() => {
    if (!borrowStatus || !collateralToken) {
      return null;
    }

    return DecimalFormat.format(borrowStatus.request.debtAmount, {
      style: 'currency',
      currency: RAFT_TOKEN,
      fractionDigits: R_TOKEN_UI_PRECISION,
      lessThanFormat: true,
    });
  }, [borrowStatus, collateralToken]);

  const collateralizationRatio = useMemo(() => {
    if (!borrowStatus || !collateralToken) {
      return null;
    }

    if (borrowStatus.request.debtAmount.isZero()) {
      return null;
    }

    const collateralPrice = tokenPriceMap[collateralToken];
    const rPrice = tokenPriceMap[RAFT_TOKEN];

    if (!collateralPrice || !rPrice) {
      return null;
    }

    const collateralValue = borrowStatus.request.collateralAmount.mul(collateralPrice);
    const debtValue = borrowStatus.request.debtAmount.mul(rPrice);

    return collateralValue.div(debtValue);
  }, [borrowStatus, collateralToken, tokenPriceMap]);

  const collateralizationRatioFormatted = useMemo(() => {
    if (!collateralizationRatio) {
      return null;
    }

    return DecimalFormat.format(collateralizationRatio, {
      style: 'percentage',
      fractionDigits: 2,
      lessThanFormat: true,
      pad: true,
    });
  }, [collateralizationRatio]);

  const liquidationPrice = useMemo(() => {
    if (!borrowStatus || borrowStatus.pending || !collateralizationRatio) {
      return null;
    }

    if (borrowStatus.request.debtAmount.isZero()) {
      return 'N/A';
    }

    const displayBaseTokenPrice = tokenPriceMap[DISPLAY_BASE_TOKEN];
    if (!displayBaseTokenPrice) {
      return null;
    }

    // stETHPrice * MinimumCollateralRatio / CollateralizationRatio

    // const value = new Decimal(1.1).mul(borrowStatus.request.debtAmount.div(borrowStatus.request.collateralAmount));

    const value = displayBaseTokenPrice.mul(new Decimal(1.1).div(collateralizationRatio));

    return DecimalFormat.format(value, {
      style: 'currency',
      currency: '$',
      fractionDigits: 2,
      lessThanFormat: true,
    });
  }, [borrowStatus, collateralizationRatio, tokenPriceMap]);

  return (
    <>
      {successModalOpened && (
        <TransactionSuccessModal
          title={successModalTitle}
          subtitle={successModalSubtitle}
          onClose={onCloseModal}
          infoHeader="Transaction summary"
          open={successModalOpened}
          infoEntries={[
            {
              id: 'collateral',
              label: collateralChange?.lt(Decimal.ZERO) ? 'Total collateral remaining' : 'Total collateral',
              value: collateralAfterTx || 'N/A',
            },
            {
              id: 'debt',
              label: debtChange?.lt(Decimal.ZERO) ? 'Total debt remaining' : 'Total debt',
              value: debtAfterTx || 'N/A',
            },
            {
              // TODO - Wait for SDK to add this value
              id: 'liquidationPrice',
              label: 'Collateral liquidation price',
              value: liquidationPrice || 'N/A',
            },
            {
              id: 'collateralizationRatio',
              label: 'Collateralization Ratio',
              value: collateralizationRatioFormatted || 'N/A',
            },
          ]}
        />
      )}
      {failedModalOpened && (
        <TransactionFailedModal
          error={borrowStatus?.error ? borrowStatus.error.message : 'Something went wrong!'}
          onClose={onCloseModal}
          onTryAgain={onRetryTransaction}
          open={failedModalOpened}
        />
      )}
    </>
  );
};
export default TransactionModal;
