import { useCallback, useEffect, useMemo, useState } from 'react';
import { R_TOKEN, RaftConfig } from '@raft-fi/sdk';
import { resetBorrowStatus, resetRedeemStatus, useBorrow, useRedeem, useTokenPrices } from '../../hooks';
import TransactionSuccessModal from './TransactionSuccessModal';
import TransactionFailedModal from './TransactionFailedModal';
import { DecimalFormat } from '@tempusfinance/decimal';
import { Typography } from '../shared';
import {
  COLLATERAL_TOKEN_UI_PRECISION,
  R_TOKEN_UI_PRECISION,
  DISPLAY_BASE_TOKEN,
  COLLATERAL_BASE_TOKEN,
} from '../../constants';
import TransactionCloseModal from './TransactionCloseModal';

const TransactionModal = () => {
  const { borrowStatus, borrow } = useBorrow();
  const { redeemStatus, redeem } = useRedeem();
  const tokenPriceMap = useTokenPrices();

  const [successModalOpened, setSuccessModalOpened] = useState<boolean>(false);
  const [failedModalOpened, setFailedModalOpened] = useState<boolean>(false);

  const currentStatus = useMemo(() => {
    return borrowStatus || redeemStatus;
  }, [borrowStatus, redeemStatus]);

  /**
   * Display success/failed modals based on borrow status - if you want to close the modal, use resetBorrowStatus()
   */
  useEffect(() => {
    if (!currentStatus || currentStatus.pending) {
      setSuccessModalOpened(false);
      setFailedModalOpened(false);
      return;
    }

    if (currentStatus.success) {
      setSuccessModalOpened(true);
    }
    if (currentStatus.error) {
      // error code ACTION_REJECTED means rejected by metamask user (not sure for other wallets)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((currentStatus.error as any).code !== 'ACTION_REJECTED') {
        setFailedModalOpened(true);
      }
    }
  }, [currentStatus]);

  const onCloseModal = useCallback(() => {
    if (!currentStatus) {
      return;
    }

    // By resetting the status we can close the modal
    if (currentStatus.statusType === 'borrow') {
      resetBorrowStatus();
    } else if (currentStatus.statusType === 'redeem') {
      resetRedeemStatus();
    }
  }, [currentStatus]);

  const onRetryTransaction = useCallback(() => {
    if (!currentStatus) {
      return;
    }

    setFailedModalOpened(false);

    if (currentStatus.statusType === 'borrow') {
      borrow(currentStatus.request);
    } else if (currentStatus.statusType === 'redeem') {
      redeem(currentStatus.request);
    }
  }, [borrow, redeem, currentStatus]);

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
    if (redeemStatus) {
      const debtValueFormatted = DecimalFormat.format(redeemStatus.request.debtAmount, {
        style: 'currency',
        currency: R_TOKEN,
        fractionDigits: R_TOKEN_UI_PRECISION,
        lessThanFormat: true,
      });

      return <Typography variant="heading1">{debtValueFormatted} redeemed</Typography>;
    }

    if (!borrowStatus || !debtChange || !collateralChange) {
      return '';
    }

    let debtLabel: string;
    let collateralLabel: string;

    if (debtChange.lt(0)) {
      debtLabel = 'repaid';
    } else {
      debtLabel = 'generated';
    }

    if (collateralChange.lt(0)) {
      collateralLabel = 'withdrawn';
    } else {
      collateralLabel = 'deposited';
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
  }, [borrowStatus, collateralChange, debtChange, redeemStatus, tokenPriceMap]);

  /**
   * Generate success modal subtitle based on borrow request params
   */
  const successModalSubtitle = useMemo(() => {
    if (redeemStatus) {
      return 'Successful transaction';
    }

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
      return 'Successful generation of R';
    }

    return 'Successful transaction';
  }, [borrowStatus, collateralChange, debtChange, redeemStatus]);

  const isClosePosition = useMemo(
    () => Boolean(borrowStatus?.request.closePosition),
    [borrowStatus?.request.closePosition],
  );

  const tokenToAdd = useMemo(() => {
    if (borrowStatus) {
      return {
        label: 'Add R to wallet',
        address: RaftConfig.getTokenAddress(R_TOKEN) || '',
        symbol: R_TOKEN,
        decimals: 18,
        image: 'https://raft.fi/rtoken.png',
      };
    }

    return {
      label: 'Add wstETH to wallet',
      address: RaftConfig.getTokenAddress(COLLATERAL_BASE_TOKEN) || '',
      symbol: COLLATERAL_BASE_TOKEN,
      decimals: 18,
      image: '', // TODO - Add wstETH image on raft.fi website
    };
  }, [borrowStatus]);

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
          tokenToAdd={tokenToAdd}
          txHash={currentStatus?.contractTransaction?.hash}
        />
      )}
      {failedModalOpened && (
        <TransactionFailedModal
          error={currentStatus?.error ? currentStatus.error.message : 'Something went wrong!'}
          onClose={onCloseModal}
          onTryAgain={onRetryTransaction}
          open={failedModalOpened}
        />
      )}
    </>
  );
};
export default TransactionModal;
