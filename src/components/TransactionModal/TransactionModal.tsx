import { useCallback, useEffect, useMemo, useState } from 'react';
import { R_TOKEN } from '@raft-fi/sdk';
import { resetBorrowStatus, useBorrow, useTokenPrices } from '../../hooks';
import TransactionSuccessModal from './TransactionSuccessModal';
import TransactionFailedModal from './TransactionFailedModal';
import { Decimal, DecimalFormat } from '@tempusfinance/decimal';
import { ValueLabel } from '../shared';
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

    return borrowStatus.request.debtChange;
  }, [borrowStatus]);

  const collateralChange = useMemo(() => {
    if (!borrowStatus) {
      return null;
    }

    return borrowStatus.request.collateralChange;
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

    const displayBaseTokenPrice = tokenPriceMap[DISPLAY_BASE_TOKEN];
    const collateralPrice = tokenPriceMap[borrowStatus.request.collateralToken];

    if (!displayBaseTokenPrice || !collateralPrice) {
      return null;
    }

    // for modal title, show what's user actually deposit/withdraw, no need to convert
    const collateralValueFormatted = DecimalFormat.format(borrowStatus.request.collateralChange.abs(), {
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

    if (collateralChange.lt(0) && debtChange.isZero()) {
      return 'Successful withdrawal';
    }
    if (collateralChange.isZero() && debtChange.lt(0)) {
      return 'Successful repayment';
    }
    if (collateralChange.gt(0) && debtChange.isZero()) {
      return 'Successful deposit';
    }
    if (collateralChange.isZero() && debtChange.gt(0)) {
      return 'Successful borrowed';
    }

    return 'Successful transaction';
  }, [borrowStatus, collateralChange, debtChange]);

  const collateralAfterTx = useMemo(() => {
    if (!borrowStatus) {
      return null;
    }

    const baseCollateralTokenPrice = tokenPriceMap[COLLATERAL_BASE_TOKEN];
    const displayBaseTokenPrice = tokenPriceMap[DISPLAY_BASE_TOKEN];
    const collateralPrice = tokenPriceMap[borrowStatus.request.collateralToken];

    if (!displayBaseTokenPrice || !collateralPrice || !baseCollateralTokenPrice) {
      return null;
    }

    const collateralChangeValue = borrowStatus.request.collateralChange.mul(collateralPrice);
    const collateralBalanceValue = borrowStatus.request.currentUserCollateral.mul(baseCollateralTokenPrice);

    const amount = collateralBalanceValue.add(collateralChangeValue).div(displayBaseTokenPrice);

    // collateral should always show in stETH, so convert to stETH
    return DecimalFormat.format(amount, {
      style: 'currency',
      currency: DISPLAY_BASE_TOKEN,
      fractionDigits: COLLATERAL_TOKEN_UI_PRECISION,
      lessThanFormat: true,
    });
  }, [borrowStatus, tokenPriceMap]);

  /**
   * Calculate new debt after transaction
   */
  const debtAfterTx = useMemo(() => {
    if (!borrowStatus) {
      return null;
    }

    const value = borrowStatus.request.currentUserDebt.add(borrowStatus.request.debtChange);

    return DecimalFormat.format(value, {
      style: 'currency',
      currency: R_TOKEN,
      fractionDigits: R_TOKEN_UI_PRECISION,
      lessThanFormat: true,
    });
  }, [borrowStatus]);

  /**
   * Calculate new collateralization ratio after transaction
   */
  const collateralizationRatio = useMemo(() => {
    if (!borrowStatus) {
      return null;
    }

    const baseCollateralTokenPrice = tokenPriceMap[COLLATERAL_BASE_TOKEN];
    const collateralPrice = tokenPriceMap[borrowStatus.request.collateralToken];
    const rPrice = tokenPriceMap[R_TOKEN];

    if (!collateralPrice || !rPrice || !baseCollateralTokenPrice) {
      return null;
    }

    const collateralChangeValue = borrowStatus.request.collateralChange.mul(collateralPrice);
    const collateralBalanceValue = borrowStatus.request.currentUserCollateral.mul(baseCollateralTokenPrice);

    const debtBalanceValue = borrowStatus.request.currentUserDebt.mul(rPrice);
    const debtChangeValue = borrowStatus.request.debtChange.mul(rPrice);

    const totalDebtValue = debtBalanceValue.add(debtChangeValue);
    if (totalDebtValue.isZero()) {
      return null;
    }

    return collateralBalanceValue.add(collateralChangeValue).div(totalDebtValue);
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

    if (collateralizationRatio.isZero()) {
      return 'N/A';
    }

    const displayBaseTokenPrice = tokenPriceMap[DISPLAY_BASE_TOKEN];
    if (!displayBaseTokenPrice) {
      return null;
    }

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
                <ValueLabel
                  color={isCollateralHealthy ? 'text-success' : undefined}
                  value={collateralizationRatioFormatted || 'N/A'}
                />
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
