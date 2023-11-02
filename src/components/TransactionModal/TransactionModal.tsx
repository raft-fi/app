import { useCallback, useEffect, useMemo, useState } from 'react';
import { R_TOKEN, RaftConfig, RAFT_TOKEN, RAFT_BPT_TOKEN, VERAFT_TOKEN } from '@raft-fi/sdk';
import {
  resetManageStatus,
  useManage,
  useLeverage,
  resetLeverageStatus,
  useCollateralConversionRates,
  usePosition,
  useStakeBptForVeRaft,
  resetStakeBptForVeRaftStatus,
  useWithdrawRaftBpt,
  resetWithdrawRaftBptStatus,
  useManageSavings,
  resetManageSavingsStatus,
  useBridgeTokens,
  useWaitForBridge,
  resetBridgeTokensStatus,
  resetWaitForBridgeStatus,
  useClaimRaftFromStakedBpt,
  resetClaimRaftFromStakedBptStatus,
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
import { BridgeFailedModal, BridgePendingModal, BridgeSuccessModal } from './BridgeModal';
import { formatCurrency, getDecimalFromTokenMap } from '../../utils';
import { NETWORK_TO_BLOCK_EXPLORER, NETWORK_TO_BLOCK_EXPLORER_URL } from '../../networks';

const TransactionModal = () => {
  const { managePositionStatus, managePosition } = useManage();
  const { leveragePositionStatus, leveragePosition } = useLeverage();
  const { stakeBptForVeRaftStatus, stakeBptForVeRaft } = useStakeBptForVeRaft();
  const { withdrawRaftBptStatus, withdrawRaftBpt } = useWithdrawRaftBpt();
  const { claimRaftFromStakedBptStatus, claimRaftFromStakedBpt } = useClaimRaftFromStakedBpt();
  const { manageSavingsStatus, manageSavings } = useManageSavings();
  const { bridgeTokensStatus, bridgeTokens } = useBridgeTokens();
  const waitForBridgeStatus = useWaitForBridge();
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
    if (manageSavingsStatus.statusType === 'manageSavings') {
      return manageSavingsStatus;
    }
    if (bridgeTokensStatus.statusType === 'bridge') {
      if (waitForBridgeStatus.pending || waitForBridgeStatus.success || waitForBridgeStatus.error) {
        return waitForBridgeStatus;
      }

      return bridgeTokensStatus;
    }
    if (
      ['stake-new', 'stake-increase', 'stake-extend', 'stake-increase-extend'].includes(
        stakeBptForVeRaftStatus.statusType as string,
      )
    ) {
      return stakeBptForVeRaftStatus;
    }
    if (withdrawRaftBptStatus) {
      return withdrawRaftBptStatus;
    }

    if (claimRaftFromStakedBptStatus) {
      return claimRaftFromStakedBptStatus;
    }

    return null;
  }, [
    bridgeTokensStatus,
    claimRaftFromStakedBptStatus,
    leveragePositionStatus,
    managePositionStatus,
    manageSavingsStatus,
    stakeBptForVeRaftStatus,
    waitForBridgeStatus,
    withdrawRaftBptStatus,
  ]);

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
    } else if (
      ['stake-new', 'stake-increase', 'stake-extend', 'stake-increase-extend'].includes(currentStatus.statusType)
    ) {
      resetStakeBptForVeRaftStatus();
    } else if (currentStatus.statusType === 'stake-withdraw') {
      resetWithdrawRaftBptStatus();
    } else if (currentStatus.statusType === 'stake-claim') {
      resetClaimRaftFromStakedBptStatus();
    } else if (currentStatus.statusType === 'manageSavings') {
      resetManageSavingsStatus();
    } else if (['bridgeTokens', 'waitForBridge'].includes(currentStatus.statusType)) {
      resetBridgeTokensStatus();
      resetWaitForBridgeStatus();
    }
  }, [currentStatus?.statusType]);

  const onRetryTransaction = useCallback(() => {
    if (!currentStatus?.statusType) {
      return;
    }

    setFailedModalOpened(false);

    if (currentStatus.statusType === 'manage') {
      managePosition?.();
    } else if (currentStatus.statusType === 'leverage') {
      leveragePosition?.();
    } else if (currentStatus.statusType === 'manageSavings') {
      manageSavings?.();
    } else if (['bridgeTokens', 'waitForBridge'].includes(currentStatus.statusType)) {
      bridgeTokens?.();
    } else if (
      ['stake-new', 'stake-increase', 'stake-extend', 'stake-increase-extend'].includes(currentStatus.statusType)
    ) {
      stakeBptForVeRaft?.();
    } else if (currentStatus.statusType === 'stake-withdraw') {
      withdrawRaftBpt(currentStatus.request);
    } else if (currentStatus.statusType === 'stake-claim') {
      claimRaftFromStakedBpt(currentStatus.request);
    }
  }, [
    bridgeTokens,
    claimRaftFromStakedBpt,
    currentStatus?.request,
    currentStatus?.statusType,
    leveragePosition,
    managePosition,
    manageSavings,
    stakeBptForVeRaft,
    withdrawRaftBpt,
  ]);

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
    if (leveragePositionStatus.statusType === 'leverage' && leveragePositionStatus.request) {
      const { collateralChange, collateralToken, underlyingCollateralToken, leverage, isClosePosition } =
        leveragePositionStatus.request;

      const displayToken = SUPPORTED_COLLATERAL_TOKEN_SETTINGS[underlyingCollateralToken].displayBaseToken;
      const collateralTokenRate = getDecimalFromTokenMap(collateralConversionRateMap, collateralToken);
      const displayTokenRate = getDecimalFromTokenMap(collateralConversionRateMap, displayToken);

      if (!collateralTokenRate || !displayTokenRate || !position) {
        return '';
      }

      const collateralBalanceInDisplayToken = position.collateralBalance.mul(displayTokenRate);
      const netBalanceInDisplayToken = position.netBalance?.mul(displayTokenRate) ?? null;

      const collateralChangeFormatted = formatCurrency(collateralChange.abs(), {
        currency: collateralToken,
        fractionDigits: COLLATERAL_TOKEN_UI_PRECISION,
        lessThanFormat: true,
      });
      const totalPrincipalCollateralBalanceFormatted = formatCurrency(netBalanceInDisplayToken, {
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
          <Typography variant="heading1">
            with {totalPrincipalCollateralBalanceFormatted ?? '---'} collateral
          </Typography>
          <Typography variant="heading1">for {collateralBalanceFormatted} exposure</Typography>
        </>
      );
    }

    if (['stake-new', 'stake-increase'].includes(stakeBptForVeRaftStatus.statusType as string)) {
      const bptAmountFormatted = formatCurrency(stakeBptForVeRaftStatus.request?.bptAmount ?? 0, {
        currency: RAFT_BPT_TOKEN,
        fractionDigits: COLLATERAL_TOKEN_UI_PRECISION,
        lessThanFormat: true,
      });

      return <Typography variant="heading1">{bptAmountFormatted} staked</Typography>;
    }

    if (stakeBptForVeRaftStatus.statusType === 'stake-extend') {
      return <Typography variant="heading1">Staking period adjusted</Typography>;
    }

    if (stakeBptForVeRaftStatus.statusType === 'stake-increase-extend') {
      return <Typography variant="heading1">Stake adjusted</Typography>;
    }

    if (withdrawRaftBptStatus) {
      const withdrawAmountFormatted = formatCurrency(withdrawRaftBptStatus.request.withdrawAmount, {
        currency: RAFT_BPT_TOKEN,
        fractionDigits: COLLATERAL_TOKEN_UI_PRECISION,
        lessThanFormat: true,
      });

      return <Typography variant="heading1">{withdrawAmountFormatted} withdrawn</Typography>;
    }

    if (claimRaftFromStakedBptStatus) {
      const claimAmountFormatted = formatCurrency(claimRaftFromStakedBptStatus.request.claimAmount, {
        currency: RAFT_TOKEN,
        fractionDigits: COLLATERAL_TOKEN_UI_PRECISION,
        lessThanFormat: true,
      });

      return <Typography variant="heading1">{claimAmountFormatted} claimed</Typography>;
    }

    if (manageSavingsStatus.statusType === 'manageSavings' && manageSavingsStatus.request) {
      const { amount } = manageSavingsStatus.request;

      const isDeposit = amount.gte(0);

      const amountFormatted = formatCurrency(amount.abs(), {
        currency: R_TOKEN,
        fractionDigits: R_TOKEN_UI_PRECISION,
        pad: true,
        lessThanFormat: true,
      });

      return (
        <Typography variant="heading1">
          {amountFormatted} {isDeposit ? 'deposited' : 'withdrawn'}
        </Typography>
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
    claimRaftFromStakedBptStatus,
    collateralChange,
    collateralConversionRateMap,
    debtChange,
    leveragePositionStatus.request,
    leveragePositionStatus.statusType,
    managePositionStatus.request,
    manageSavingsStatus.request,
    manageSavingsStatus.statusType,
    position,
    stakeBptForVeRaftStatus.request?.bptAmount,
    stakeBptForVeRaftStatus.statusType,
    withdrawRaftBptStatus,
  ]);

  /**
   * Generate success modal subtitle based on borrow request params
   */
  const successModalSubtitle = useMemo(() => {
    if (leveragePositionStatus.statusType === 'leverage' && collateralChange) {
      return 'Successful transaction';
    }

    if (withdrawRaftBptStatus) {
      return 'Successful withdrawal';
    }

    if (claimRaftFromStakedBptStatus) {
      return 'Successful transaction';
    }

    if (manageSavingsStatus.statusType === 'manageSavings') {
      return 'Successful transaction';
    }

    if (
      ['stake-new', 'stake-increase', 'stake-extend', 'stake-increase-extend'].includes(
        stakeBptForVeRaftStatus.statusType as string,
      )
    ) {
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
  }, [
    claimRaftFromStakedBptStatus,
    collateralChange,
    debtChange,
    leveragePositionStatus.statusType,
    manageSavingsStatus.statusType,
    stakeBptForVeRaftStatus.statusType,
    withdrawRaftBptStatus,
  ]);

  const tokenToAdd = useMemo(() => {
    if (['manage', 'bridgeTokens', 'waitForBridge'].includes(currentStatus?.statusType ?? '')) {
      return {
        label: 'Add R to wallet',
        address: RaftConfig.getTokenAddress(R_TOKEN) || '',
        symbol: R_TOKEN,
        decimals: 18,
        image: 'https://raft.fi/rtoken.png',
      };
    }

    if (currentStatus?.statusType === 'manageSavings' && manageSavingsStatus.request) {
      const isDeposit = manageSavingsStatus.request?.amount.gt(0);
      if (!isDeposit) {
        return null;
      }

      const rrAddress = RaftConfig.getNetworkConfig(manageSavingsStatus.request.network).tokens.RR.address;

      return {
        label: 'Add RR to wallet',
        // TODO - Change this address based on chain user used to withdraw
        address: rrAddress,
        symbol: 'RR',
        decimals: 18,
        image: 'https://raft.fi/rrToken.svg',
      };
    }

    if (
      ['stake-new', 'stake-increase', 'stake-extend', 'stake-increase-extend'].includes(
        currentStatus?.statusType as string,
      )
    ) {
      return {
        label: 'Add veRAFT to wallet',
        address: RaftConfig.getTokenAddress(VERAFT_TOKEN) || '',
        symbol: VERAFT_TOKEN,
        decimals: 18,
        image: 'https://raft.fi/veRaft.svg',
      };
    }

    return null;
  }, [currentStatus?.statusType, manageSavingsStatus]);

  const explorerLabel = useMemo(() => {
    if (currentStatus?.statusType === 'manageSavings' && currentStatus.request) {
      return NETWORK_TO_BLOCK_EXPLORER[currentStatus.request.network];
    }
    return 'Etherscan';
  }, [currentStatus]);

  const explorerUrl = useMemo(() => {
    if (currentStatus?.statusType === 'manageSavings' && currentStatus.request) {
      const explorerBaseUrl = NETWORK_TO_BLOCK_EXPLORER_URL[currentStatus.request.network];

      return `${explorerBaseUrl}/tx/${currentStatus.txHash}`;
    }
  }, [currentStatus]);

  if (['bridgeTokens', 'waitForBridge'].includes(currentStatus?.statusType ?? '') && bridgeTokensStatus.request) {
    const { sourceChainName, destinationChainName, amountToBridge } = bridgeTokensStatus.request;

    if (currentStatus?.statusType === 'waitForBridge' && currentStatus.success) {
      return (
        <BridgeSuccessModal
          open
          onClose={onCloseModal}
          fromNetwork={sourceChainName}
          toNetwork={destinationChainName}
          amount={amountToBridge}
          tokenToAdd={tokenToAdd}
          messageId={currentStatus?.txHash}
        />
      );
    }

    if (currentStatus?.statusType === 'waitForBridge' && currentStatus.pending) {
      return (
        <BridgePendingModal
          open
          onClose={onCloseModal}
          fromNetwork={sourceChainName}
          toNetwork={destinationChainName}
          amount={amountToBridge}
          tokenToAdd={tokenToAdd}
          messageId={currentStatus?.txHash}
        />
      );
    }

    return failedModalOpened ? (
      <BridgeFailedModal
        open
        error={currentStatus?.error ? currentStatus.error.message : 'Something went wrong!'}
        onClose={onCloseModal}
        fromNetwork={sourceChainName}
        toNetwork={destinationChainName}
        onTryAgain={onRetryTransaction}
      />
    ) : null;
  }

  return (
    <>
      {successModalOpened && isClosePosition && (
        <TransactionCloseModal
          open={successModalOpened}
          title={successModalTitle}
          txHash={currentStatus?.txHash}
          onClose={onCloseModal}
          blockExplorerLabel={explorerLabel}
          blockExplorerUrl={explorerUrl}
        />
      )}
      {successModalOpened && !isClosePosition && (
        <TransactionSuccessModal
          title={successModalTitle}
          subtitle={successModalSubtitle}
          onClose={onCloseModal}
          open={successModalOpened}
          tokenToAdd={tokenToAdd}
          txHash={currentStatus?.txHash}
          blockExplorerLabel={explorerLabel}
          blockExplorerUrl={explorerUrl}
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
