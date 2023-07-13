import { useCallback, useEffect, useMemo, useState } from 'react';
import { R_TOKEN, RaftConfig } from '@raft-fi/sdk';
import {
  resetRedeemStatus,
  resetManageStatus,
  useManage,
  useRedeem,
  useLeverage,
  resetLeverageStatus,
  useCollateralConversionRates,
  usePosition,
} from '../../hooks';
import TransactionSuccessModal from './TransactionSuccessModal';
import TransactionFailedModal from './TransactionFailedModal';
import { Typography } from '../shared';
import {
  COLLATERAL_TOKEN_UI_PRECISION,
  R_TOKEN_UI_PRECISION,
  SUPPORTED_COLLATERAL_TOKEN_SETTINGS,
} from '../../constants';
import TransactionCloseModal from './TransactionCloseModal';
import { formatCurrency, getDecimalFromTokenMap } from '../../utils';

const TransactionModal = () => {
  const { managePositionStatus, managePosition } = useManage();
  const { leveragePositionStatus, leveragePosition } = useLeverage();
  const { redeemStatus, redeem } = useRedeem();
  const collateralConversionRateMap = useCollateralConversionRates();
  const position = usePosition();

  const [successModalOpened, setSuccessModalOpened] = useState<boolean>(false);
  const [failedModalOpened, setFailedModalOpened] = useState<boolean>(false);

  const currentStatus = useMemo(() => {
    if (managePositionStatus.statusType === 'manage') {
      return managePositionStatus;
    }
    if (leveragePositionStatus.statusType === 'leverage') {
      return leveragePositionStatus;
    }
    if (redeemStatus) {
      return redeemStatus;
    }

    return null;
  }, [leveragePositionStatus, managePositionStatus, redeemStatus]);

  /**
   * Display success/failed modals based on borrow status - if you want to close the modal, use resetBorrowStatus()
   */
  useEffect(() => {
    if (!currentStatus || currentStatus.pending || !currentStatus.statusType) {
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
    if (!currentStatus?.statusType) {
      return;
    }

    // By resetting the status we can close the modal
    if (currentStatus.statusType === 'manage') {
      resetManageStatus();
    } else if (currentStatus.statusType === 'leverage') {
      resetLeverageStatus();
    } else if (currentStatus.statusType === 'redeem') {
      resetRedeemStatus();
    }
  }, [currentStatus]);

  const onRetryTransaction = useCallback(() => {
    if (!currentStatus?.statusType) {
      return;
    }

    setFailedModalOpened(false);

    if (currentStatus.statusType === 'manage') {
      managePosition?.();
    } else if (currentStatus.statusType === 'leverage') {
      leveragePosition?.();
    } else if (currentStatus.statusType === 'redeem') {
      redeem(currentStatus.request);
    }
  }, [currentStatus?.request, currentStatus?.statusType, leveragePosition, managePosition, redeem]);

  const collateralChange = useMemo(() => {
    if (managePositionStatus.statusType === 'manage') {
      return managePositionStatus.request?.collateralChange ?? null;
    }

    if (leveragePositionStatus.statusType === 'leverage') {
      return leveragePositionStatus.request?.collateralChange ?? null;
    }

    return null;
  }, [
    leveragePositionStatus.request?.collateralChange,
    leveragePositionStatus.statusType,
    managePositionStatus.request?.collateralChange,
    managePositionStatus.statusType,
  ]);

  const debtChange = useMemo(() => {
    if (managePositionStatus.statusType !== 'manage') {
      return null;
    }

    return managePositionStatus.request?.debtChange ?? null;
  }, [managePositionStatus.request?.debtChange, managePositionStatus.statusType]);

  // TODO: add checking close position for leverage
  const isClosePosition = useMemo(
    () =>
      (managePositionStatus.statusType === 'manage' && managePositionStatus.request?.isClosePosition) ||
      (leveragePositionStatus.statusType === 'leverage' && leveragePositionStatus.request?.isClosePosition),
    [
      leveragePositionStatus.request?.isClosePosition,
      leveragePositionStatus.statusType,
      managePositionStatus.request?.isClosePosition,
      managePositionStatus.statusType,
    ],
  );

  /**
   * Generate success modal title based on borrow request params
   */
  const successModalTitle = useMemo(() => {
    if (redeemStatus) {
      const debtValueFormatted = formatCurrency(redeemStatus.request.debtAmount, {
        currency: R_TOKEN,
        fractionDigits: R_TOKEN_UI_PRECISION,
        lessThanFormat: true,
      });

      return <Typography variant="heading1">{debtValueFormatted} redeemed</Typography>;
    }

    if (leveragePositionStatus.statusType === 'leverage' && leveragePositionStatus.request) {
      const {
        currentPrincipalCollateral,
        collateralChange,
        collateralToken,
        underlyingCollateralToken,
        leverage,
        isClosePosition,
      } = leveragePositionStatus.request;

      const displayToken = SUPPORTED_COLLATERAL_TOKEN_SETTINGS[underlyingCollateralToken].displayBaseToken;
      const collateralTokenRate = getDecimalFromTokenMap(collateralConversionRateMap, collateralToken);
      const displayTokenRate = getDecimalFromTokenMap(collateralConversionRateMap, displayToken);

      if (!collateralTokenRate || !displayTokenRate || !position) {
        return '';
      }

      const displayTokenChange = collateralChange.div(collateralTokenRate).mul(displayTokenRate);
      // subgraph may take time to process the principal collateral balance, calculate here
      const totalPrincipalCollateralBalanceInDisplayToken = currentPrincipalCollateral
        .mul(displayTokenRate)
        .add(displayTokenChange);
      const collateralBalanceInDisplayToken = position.collateralBalance.mul(displayTokenRate);

      const collateralChangeFormatted = formatCurrency(collateralChange.abs(), {
        currency: collateralToken,
        fractionDigits: COLLATERAL_TOKEN_UI_PRECISION,
        lessThanFormat: true,
      });
      const totalPrincipalCollateralBalanceFormatted = formatCurrency(totalPrincipalCollateralBalanceInDisplayToken, {
        currency: displayToken,
        fractionDigits: COLLATERAL_TOKEN_UI_PRECISION,
        lessThanFormat: true,
      });
      const collateralBalanceFormatted = formatCurrency(collateralBalanceInDisplayToken, {
        currency: displayToken,
        fractionDigits: COLLATERAL_TOKEN_UI_PRECISION,
        lessThanFormat: true,
      });

      if (isClosePosition) {
        return (
          <>
            <Typography variant="heading1">Leverage position closed</Typography>
            <Typography variant="heading1">{collateralChangeFormatted} withdrawn</Typography>
          </>
        );
      }

      return (
        <>
          <Typography variant="heading1">Leverage set to {leverage.toRounded(1)}x</Typography>
          <Typography variant="heading1">with {totalPrincipalCollateralBalanceFormatted} collateral</Typography>
          <Typography variant="heading1">for {collateralBalanceFormatted} exposure</Typography>
        </>
      );
    }

    if (!managePositionStatus.request || !debtChange || !collateralChange) {
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

    const debtValueFormatted = formatCurrency(debtChange.abs(), {
      currency: R_TOKEN,
      fractionDigits: R_TOKEN_UI_PRECISION,
      lessThanFormat: true,
    });

    // for modal title, show what's user actually deposit/withdraw, no need to convert
    const collateralValueFormatted = formatCurrency(collateralChange.abs(), {
      currency: managePositionStatus.request.collateralToken,
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
  }, [
    collateralChange,
    collateralConversionRateMap,
    debtChange,
    leveragePositionStatus.request,
    leveragePositionStatus.statusType,
    managePositionStatus.request,
    position,
    redeemStatus,
  ]);

  /**
   * Generate success modal subtitle based on borrow request params
   */
  const successModalSubtitle = useMemo(() => {
    if (redeemStatus) {
      return 'Successful redemption';
    }

    if (leveragePositionStatus.statusType === 'leverage' && collateralChange) {
      return 'Successful transaction';
    }

    if (!debtChange || !collateralChange) {
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
  }, [collateralChange, debtChange, leveragePositionStatus.statusType, redeemStatus]);

  const tokenToAdd = useMemo(() => {
    if (currentStatus?.statusType === 'manage') {
      return {
        label: 'Add R to wallet',
        address: RaftConfig.getTokenAddress(R_TOKEN) || '',
        symbol: R_TOKEN,
        decimals: 18,
        image: 'https://raft.fi/rtoken.png',
      };
    }

    if (redeemStatus) {
      const underlyingToken = redeemStatus.request.underlyingCollateralToken;
      const token = SUPPORTED_COLLATERAL_TOKEN_SETTINGS[underlyingToken].redeemToken;

      return {
        label: `Add ${token} to wallet`,
        address: RaftConfig.getTokenAddress(token) || '',
        symbol: token,
        decimals: 18,
        image: '', // TODO - Add wstETH image on raft.fi website
      };
    }

    return null;
  }, [currentStatus?.statusType, redeemStatus]);

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
          txHash={currentStatus?.txHash}
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
