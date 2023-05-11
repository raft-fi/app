import { useCallback, useEffect, useMemo, useState } from 'react';
import { R_TOKEN } from '@raft-fi/sdk';
import { resetBorrowStatus, useBorrow, useTokenPrices } from '../../hooks';
import TransactionSuccessModal from './TransactionSuccessModal';
import TransactionFailedModal from './TransactionFailedModal';
import { Decimal, DecimalFormat } from '@tempusfinance/decimal';
import { Typography, ValueLabel } from '../shared';
import {
  COLLATERAL_TOKEN_UI_PRECISION,
  R_TOKEN_UI_PRECISION,
  COLLATERAL_BASE_TOKEN,
  DISPLAY_BASE_TOKEN,
  HEALTHY_RATIO,
} from '../../constants';

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
    if (!borrowStatus || !debtChange || !collateralChange) {
      return '';
    }

    let debtLabel: string;
    let collateralLabel: string;

    if (debtChange.lt(0)) {
      debtLabel = 'repayment';
    } else {
      debtLabel = 'borrow';
    }

    if (collateralChange.lt(0)) {
      collateralLabel = 'withdrawal';
    } else {
      collateralLabel = 'deposit';
    }

    const debtValueFormatted = DecimalFormat.format(debtChange.abs(), {
      style: 'currency',
      currency: R_TOKEN,
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
      currency: borrowStatus.request.collateralToken,
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
  }, [borrowStatus, collateralChange, debtChange, tokenPriceMap]);

  /**
   * Generate success modal subtitle based on borrow request params
   */
  const successModalSubtitle = useMemo(() => {
    if (!borrowStatus || !debtChange || !collateralChange) {
      return '';
    }

    if (collateralChange.lt(0) && debtChange.equals(0)) {
      return 'Successful withdrawal';
    }
    if (collateralChange.equals(0) && debtChange.lt(0)) {
      return 'Successful repayment';
    }
    if (collateralChange.gt(0) && debtChange.equals(0)) {
      return 'Successful deposit';
    }
    if (collateralChange.equals(0) && debtChange.gt(0)) {
      return 'Successful borrow';
    }

    return 'Successful transaction';
  }, [borrowStatus, collateralChange, debtChange]);

  const collateralAfterTx = useMemo(() => {
    if (!borrowStatus) {
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
      currency: borrowStatus.request.collateralToken,
      fractionDigits: COLLATERAL_TOKEN_UI_PRECISION,
      lessThanFormat: true,
    });
  }, [borrowStatus, tokenPriceMap]);

  const debtAfterTx = useMemo(() => {
    if (!borrowStatus) {
      return null;
    }

    return DecimalFormat.format(borrowStatus.request.debtAmount, {
      style: 'currency',
      currency: R_TOKEN,
      fractionDigits: R_TOKEN_UI_PRECISION,
      lessThanFormat: true,
    });
  }, [borrowStatus]);

  const collateralizationRatio = useMemo(() => {
    if (!borrowStatus) {
      return null;
    }

    if (borrowStatus.request.debtAmount.isZero()) {
      return null;
    }

    const collateralPrice = tokenPriceMap[borrowStatus.request.collateralToken];
    const rPrice = tokenPriceMap[R_TOKEN];

    if (!collateralPrice || !rPrice) {
      return null;
    }

    const collateralValue = borrowStatus.request.collateralAmount.mul(collateralPrice);
    const debtValue = borrowStatus.request.debtAmount.mul(rPrice);

    return collateralValue.div(debtValue);
  }, [borrowStatus, tokenPriceMap]);

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

  const isCollateralHealthy = useMemo(() => collateralizationRatio?.gte(HEALTHY_RATIO), [collateralizationRatio]);

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
              label: collateralChange?.lt(0) ? 'Total collateral remaining' : 'Total collateral',
              value: collateralAfterTx || 'N/A',
            },
            {
              id: 'debt',
              label: debtChange?.lt(0) ? 'Total debt remaining' : 'Total debt',
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
              value: (
                <Typography
                  variant="body-primary"
                  color={isCollateralHealthy ? 'text-success' : undefined}
                  weight="medium"
                >
                  {collateralizationRatioFormatted || 'N/A'}
                </Typography>
              ),
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
