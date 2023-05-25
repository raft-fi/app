import { useCallback, useEffect, useMemo, useState } from 'react';
import { R_TOKEN } from '@raft-fi/sdk';
import { resetBorrowStatus, useBorrow, useTokenPrices } from '../../hooks';
import TransactionSuccessModal from './TransactionSuccessModal';
import TransactionFailedModal from './TransactionFailedModal';
import { DecimalFormat } from '@tempusfinance/decimal';
import { Typography } from '../shared';
import { COLLATERAL_TOKEN_UI_PRECISION, R_TOKEN_UI_PRECISION, DISPLAY_BASE_TOKEN } from '../../constants';
import TransactionCloseModal from './TransactionCloseModal';

const TransactionModal = () => {
  const { borrowStatus, borrow } = useBorrow();
  const tokenPriceMap = useTokenPrices();

  const [successModalOpened, setSuccessModalOpened] = useState<boolean>(false);
  const [failedModalOpened, setFailedModalOpened] = useState<boolean>(false);

  /**
   * Display success/failed modals based on borrow status - if you want to close the modal, use resetBorrowStatus()
   */
  useEffect(() => {
    if (!borrowStatus || borrowStatus.pending) {
      setSuccessModalOpened(false);
      setFailedModalOpened(false);
      return;
    }

    if (borrowStatus.success) {
      setSuccessModalOpened(true);
    }
    if (borrowStatus.error) {
      // error code ACTION_REJECTED means rejected by metamask user (not sure for other wallets)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((borrowStatus.error as any).code !== 'ACTION_REJECTED') {
        setFailedModalOpened(true);
      }
    }
  }, [borrowStatus]);

  const onCloseModal = useCallback(() => {
    // By resetting the borrow status we can close the modal
    resetBorrowStatus();
  }, []);

  const onRetryTransaction = useCallback(() => {
    if (!borrowStatus) {
      return;
    }

    setFailedModalOpened(false);

    borrow(borrowStatus.request);
  }, [borrow, borrowStatus]);

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
        {!collateralChange.isZero() && (
          <Typography variant="heading1">
            {collateralValueFormatted} {collateralLabel}
          </Typography>
        )}
        {!debtChange.isZero() && (
          <Typography variant="heading1">
            {debtValueFormatted} {debtLabel}
          </Typography>
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
      return 'Successfully withdrawn';
    }
    if (collateralChange.isZero() && debtChange.lt(0)) {
      return 'Successfully repaid';
    }
    if (collateralChange.gt(0) && debtChange.isZero()) {
      return 'Successfully deposited';
    }
    if (collateralChange.isZero() && debtChange.gt(0)) {
      return 'Successfully borrowed';
    }

    return 'Successful transaction';
  }, [borrowStatus, collateralChange, debtChange]);

  const isClosePosition = useMemo(
    () => Boolean(borrowStatus?.request.closePosition),
    [borrowStatus?.request.closePosition],
  );

  return (
    <>
      {successModalOpened && isClosePosition && (
        <TransactionCloseModal open={successModalOpened} title={successModalTitle} onClose={onCloseModal} />
      )}
      {successModalOpened && !isClosePosition && (
        <TransactionSuccessModal
          title={successModalTitle}
          subtitle={successModalSubtitle}
          onClose={onCloseModal}
          open={successModalOpened}
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
