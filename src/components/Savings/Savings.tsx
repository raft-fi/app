import { MouseEvent, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Decimal, DecimalFormat } from '@tempusfinance/decimal';
import { useConnectWallet } from '@web3-onboard/react';
import { R_TOKEN, SUPPORTED_SAVINGS_NETWORKS, isSupportedSavingsNetwork } from '@raft-fi/sdk';
import { ButtonWrapper, TokenLogo } from 'tempus-ui';
import {
  setCurrentSavingsNetwork,
  useAppLoaded,
  useCurrentSavingsNetwork,
  useCurrentUserSavings,
  useEIP1193Provider,
  useManageSavings,
  useNetwork,
  useSavingsMaxDeposit,
  useSavingsTokenBalance,
  useWallet,
} from '../../hooks';
import { R_TOKEN_UI_PRECISION } from '../../constants';
import {
  NETWORK_IDS,
  NETWORK_NAMES,
  NETWORK_WALLET_CURRENCIES,
  NETWORK_WALLET_ENDPOINTS,
  SAVINGS_MAINNET_NETWORKS,
  SAVINGS_TESTNET_NETWORKS,
} from '../../networks';
import {
  CurrencyInput,
  ExecuteButton,
  Icon,
  NetworkSelector,
  Tooltip,
  TooltipWrapper,
  Typography,
  ValueLabel,
} from '../shared';
import LoadingSavings from '../LoadingSavings';
import FAQ from './FAQ';
import Stats from './Stats';

import './Savings.scss';

const Savings = () => {
  const [, connect] = useConnectWallet();

  const appLoaded = useAppLoaded();
  const { network } = useNetwork();
  const eip1193Provider = useEIP1193Provider();
  const wallet = useWallet();
  const savingsTokenBalance = useSavingsTokenBalance();
  const savingsMaxDeposit = useSavingsMaxDeposit();
  const currentUserSavings = useCurrentUserSavings();
  const selectedNetwork = useCurrentSavingsNetwork();
  const { manageSavingsStatus, manageSavings, manageSavingsStepsStatus, requestManageSavingsStep } = useManageSavings();

  const [isAddCollateral, setIsAddCollateral] = useState<boolean>(true);
  const [amount, setAmount] = useState<string>('');
  const [actionButtonState, setActionButtonState] = useState<string>('default');

  const amountParsed = useMemo(() => {
    return Decimal.parse(amount, 0);
  }, [amount]);

  useEffect(() => {
    // In case user is withdrawing we need to set negative amount value.
    requestManageSavingsStep?.({
      amount: isAddCollateral ? amountParsed : amountParsed.mul(-1),
      network: selectedNetwork,
    });
  }, [amountParsed, isAddCollateral, wallet, selectedNetwork, requestManageSavingsStep]);

  const handleSwitchCollateralAction = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    const addCollateral = event.currentTarget.getAttribute('data-id') === 'addCollateral';
    setIsAddCollateral(addCollateral);
  }, []);

  const handleCollateralValueUpdate = useCallback((amount: string) => {
    setAmount(amount);
  }, []);

  const walletConnected = useMemo(() => Boolean(wallet), [wallet]);

  const rTokenBalance = useMemo(() => savingsTokenBalance, [savingsTokenBalance]);

  const rInputLabelComponent = useMemo(
    () => (
      <>
        <ButtonWrapper
          className="raft__savings__input-deposit"
          data-id="addCollateral"
          selected={isAddCollateral}
          onClick={handleSwitchCollateralAction}
        >
          <Typography variant="overline" weight="semi-bold">
            DEPOSIT
          </Typography>
        </ButtonWrapper>
        <ButtonWrapper
          className="raft__savings__input-withdraw"
          data-id="removeCollateral"
          selected={!isAddCollateral}
          onClick={handleSwitchCollateralAction}
        >
          <Typography variant="overline" weight="semi-bold">
            WITHDRAW
          </Typography>
        </ButtonWrapper>
      </>
    ),
    [isAddCollateral, handleSwitchCollateralAction],
  );

  const executionSteps = useMemo(
    () => manageSavingsStepsStatus.result?.numberOfSteps,
    [manageSavingsStepsStatus.result?.numberOfSteps],
  );
  const currentExecutionSteps = useMemo(
    () => manageSavingsStepsStatus.result?.stepNumber,
    [manageSavingsStepsStatus.result?.stepNumber],
  );
  const executionType = useMemo(
    () => manageSavingsStepsStatus.result?.type?.name ?? null,
    [manageSavingsStepsStatus.result?.type],
  );

  const hasNonEmptyInput = useMemo(() => !amountParsed.isZero(), [amountParsed]);

  const hasEnoughRToDeposit = useMemo(() => {
    // In case R token balance is still loading
    if (!rTokenBalance) {
      return false;
    }

    return amountParsed.lte(rTokenBalance);
  }, [amountParsed, rTokenBalance]);

  const hasEnoughRToWithdraw = useMemo(() => {
    // In case current user savings are still loading
    if (!currentUserSavings) {
      return false;
    }

    return amountParsed.lte(currentUserSavings);
  }, [amountParsed, currentUserSavings]);

  const isPositionWithinDepositCap = useMemo(() => {
    // In case savingsMaxDeposit is still loading
    if (!savingsMaxDeposit) {
      return false;
    }

    return amountParsed.lte(savingsMaxDeposit);
  }, [amountParsed, savingsMaxDeposit]);

  const isWrongNetwork = useMemo(() => {
    if (!network) {
      return false;
    }

    return network.chainId.toString() !== String(NETWORK_IDS[selectedNetwork]);
  }, [network, selectedNetwork]);

  // TODO - Handle withdraw error messages inside this hook
  const buttonLabel = useMemo(() => {
    if (!walletConnected) {
      return 'Connect wallet';
    }

    if (isWrongNetwork) {
      return `Switch to ${NETWORK_NAMES[selectedNetwork]}`;
    }

    if (isAddCollateral && !hasEnoughRToDeposit) {
      return 'Insufficient funds';
    }

    if (!isAddCollateral && !hasEnoughRToWithdraw) {
      return 'Insufficient balance';
    }

    if (isAddCollateral && !isPositionWithinDepositCap) {
      return 'Deposit capacity reached, please try again later';
    }

    if (manageSavingsStepsStatus.error) {
      return 'Something has gone wrong, please try again';
    }

    if (executionSteps === 1) {
      return manageSavingsStatus.pending ? 'Executing' : 'Execute';
    }

    if (executionType === 'approve' || executionType === 'permit') {
      return manageSavingsStatus.pending
        ? `Approving R (${currentExecutionSteps}/${executionSteps})`
        : `Approve R (${currentExecutionSteps}/${executionSteps})`;
    }

    if (executionType === 'manageSavings') {
      return manageSavingsStatus.pending
        ? `Executing (${currentExecutionSteps}/${executionSteps})`
        : `Execute (${currentExecutionSteps}/${executionSteps})`;
    }

    // input is still empty, showing default button text
    if (!hasNonEmptyInput) {
      return 'Execute';
    }

    return 'Execute';
  }, [
    walletConnected,
    isWrongNetwork,
    isAddCollateral,
    hasEnoughRToDeposit,
    hasEnoughRToWithdraw,
    isPositionWithinDepositCap,
    manageSavingsStepsStatus.error,
    executionSteps,
    executionType,
    hasNonEmptyInput,
    selectedNetwork,
    manageSavingsStatus.pending,
    currentExecutionSteps,
  ]);

  const subHeaderLabel = useMemo(() => {
    if (isAddCollateral) {
      return 'Deposit into the R Savings Rate to earn more R.';
    }

    return 'Withdraw your savings and earned rewards.';
  }, [isAddCollateral]);

  const hasInputFilled = useMemo(() => !amountParsed.isZero(), [amountParsed]);

  const canExecuteDeposit = useMemo(
    () =>
      Boolean(
        hasInputFilled &&
          hasEnoughRToDeposit &&
          !isWrongNetwork &&
          isPositionWithinDepositCap &&
          !manageSavingsStepsStatus.error,
      ),
    [hasEnoughRToDeposit, hasInputFilled, isPositionWithinDepositCap, isWrongNetwork, manageSavingsStepsStatus.error],
  );

  const canExecuteWithdraw = useMemo(() => {
    return Boolean(hasInputFilled && hasEnoughRToWithdraw && !isWrongNetwork && !manageSavingsStepsStatus.error);
  }, [hasEnoughRToWithdraw, hasInputFilled, isWrongNetwork, manageSavingsStepsStatus.error]);

  const canExecute = useMemo(() => {
    // Enable execute button in case network is wrong (in this case button asks user to switch network)
    if (isWrongNetwork) {
      return true;
    }

    if (isAddCollateral) {
      return canExecuteDeposit;
    }
    return canExecuteWithdraw;
  }, [canExecuteDeposit, canExecuteWithdraw, isAddCollateral, isWrongNetwork]);

  const inputMaxAmount = useMemo(() => {
    if (isAddCollateral) {
      return rTokenBalance;
    }
    return currentUserSavings;
  }, [currentUserSavings, isAddCollateral, rTokenBalance]);

  const inputMaxAmountFormatted = useMemo(() => {
    if (!inputMaxAmount) {
      return null;
    }

    return DecimalFormat.format(inputMaxAmount, {
      style: 'currency',
      currency: R_TOKEN,
      fractionDigits: R_TOKEN_UI_PRECISION,
      lessThanFormat: true,
      pad: true,
    });
  }, [inputMaxAmount]);

  const errorMessage = useMemo(() => {
    if (!walletConnected || isWrongNetwork) {
      return;
    }

    if (isAddCollateral && !hasEnoughRToDeposit) {
      return 'Insufficient funds';
    }

    if (!isAddCollateral && !hasEnoughRToWithdraw) {
      return 'Insufficient balance';
    }

    if (isAddCollateral && !isPositionWithinDepositCap) {
      return `Not enough capacity for the deposit amount. Please reduce and try again.`;
    }
  }, [
    hasEnoughRToDeposit,
    hasEnoughRToWithdraw,
    isAddCollateral,
    isPositionWithinDepositCap,
    isWrongNetwork,
    walletConnected,
  ]);

  const savingsAfter = useMemo(() => {
    if (!currentUserSavings) {
      return null;
    }

    if (isAddCollateral) {
      return currentUserSavings.add(amountParsed);
    }
    return Decimal.max(currentUserSavings.sub(amountParsed), Decimal.ZERO);
  }, [amountParsed, currentUserSavings, isAddCollateral]);

  const availableSavingsNetworks = useMemo(() => {
    return SUPPORTED_SAVINGS_NETWORKS.filter(network => {
      if (import.meta.env.VITE_ENVIRONMENT === 'mainnet') {
        return SAVINGS_MAINNET_NETWORKS.includes(network);
      } else {
        return SAVINGS_TESTNET_NETWORKS.includes(network);
      }
    });
  }, []);

  const savingsAfterFormatted = useMemo(() => {
    if (!savingsAfter) {
      return null;
    }

    return DecimalFormat.format(savingsAfter, {
      style: 'currency',
      currency: R_TOKEN,
      fractionDigits: R_TOKEN_UI_PRECISION,
      lessThanFormat: true,
      pad: true,
    });
  }, [savingsAfter]);

  const onMaxAmountClick = useCallback(() => {
    if (!inputMaxAmount) {
      return null;
    }

    setAmount(inputMaxAmount.toString());
  }, [inputMaxAmount]);

  const onSwitchNetwork = useCallback(async () => {
    if (eip1193Provider) {
      try {
        // https://eips.ethereum.org/EIPS/eip-3326
        await eip1193Provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${NETWORK_IDS[selectedNetwork].toString(16)}` }],
        });
      } catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((error as any).code === 4902) {
          // https://eips.ethereum.org/EIPS/eip-3085
          await eip1193Provider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${NETWORK_IDS[selectedNetwork].toString(16)}`,
                chainName: NETWORK_NAMES[selectedNetwork],
                rpcUrls: [NETWORK_WALLET_ENDPOINTS[selectedNetwork]],
                nativeCurrency: NETWORK_WALLET_CURRENCIES[selectedNetwork],
              },
            ],
          });
        } else {
          console.error(`Failed to switch network to ${selectedNetwork}`);
        }
      }
    }
  }, [eip1193Provider, selectedNetwork]);

  const onAction = useCallback(() => {
    if (isWrongNetwork) {
      onSwitchNetwork();
    } else {
      manageSavings?.();
    }
  }, [manageSavings, onSwitchNetwork, isWrongNetwork]);

  const handleSelectedNetworkChange = useCallback((value: string) => {
    if (isSupportedSavingsNetwork(value)) {
      setCurrentSavingsNetwork(value);
    }
  }, []);

  const onConnectWallet = useCallback(() => {
    connect();
  }, [connect]);

  /**
   * Update action button state based on current approve/borrow request status
   */
  useEffect(() => {
    if (manageSavingsStatus.pending || manageSavingsStepsStatus.pending) {
      setActionButtonState('loading');
    } else {
      setActionButtonState('default');
    }
  }, [manageSavingsStatus.pending, manageSavingsStepsStatus.pending]);

  /**
   * Once the savings transaction is executed, reset the input value
   */
  useEffect(() => {
    if (manageSavingsStatus.success && manageSavingsStatus.statusType === 'manageSavings') {
      setAmount('');
    }
  }, [manageSavingsStatus.statusType, manageSavingsStatus.success]);

  if (!appLoaded) {
    return (
      <div className="raft__savings__container">
        <LoadingSavings />
      </div>
    );
  }

  return (
    <div className="raft__savings__container">
      <div className="raft__savings__main">
        <div className="raft__savings">
          <Typography variant="heading2" weight="medium">
            Earn
          </Typography>
          <div className="raft__savings__subheader">
            <Typography variant="body" weight="regular" color="text-secondary">
              {subHeaderLabel}
            </Typography>
          </div>

          <div className="raft__savings__networkSelectorContainer">
            <Typography variant="overline" weight="semi-bold" color="text-secondary">
              NETWORK
            </Typography>
            <NetworkSelector
              networks={availableSavingsNetworks}
              selectedNetwork={selectedNetwork}
              onNetworkChange={handleSelectedNetworkChange}
            />
          </div>

          <div className="raft__savings__input">
            <CurrencyInput
              label={rInputLabelComponent}
              precision={18}
              selectedToken={'R'}
              tokens={['R']}
              value={amount}
              onValueUpdate={handleCollateralValueUpdate}
              error={Boolean(errorMessage)}
              errorMsg={errorMessage}
              maxAmount={inputMaxAmount}
              maxAmountIconVisible={isAddCollateral}
              maxAmountLabel={isAddCollateral ? '' : 'Balance'}
              maxAmountFormatted={inputMaxAmountFormatted || ''}
              onMaxAmountClick={onMaxAmountClick}
            />
          </div>

          <div className="raft__savings__transactionInfo">
            {savingsAfterFormatted && (
              <>
                <div className="raft__savings__transactionInfoTitle">
                  <Typography variant="overline">SAVINGS AFTER</Typography>
                  <TooltipWrapper
                    tooltipContent={
                      <Tooltip className="raft__savings__infoTooltip">
                        <Typography variant="body2">
                          Summary of your savings after the transaction is executed.
                        </Typography>
                      </Tooltip>
                    }
                    placement="top"
                  >
                    <Icon variant="info" size="tiny" />
                  </TooltipWrapper>
                </div>
                <div className="raft__savings__transactionInfoValue">
                  <TokenLogo type="token-R" size={20} />
                  <ValueLabel value={savingsAfterFormatted} valueSize="body" />
                </div>
              </>
            )}

            <div className="raft__savings__transactionInfoTitle">
              <Typography variant="overline">PROTOCOL FEES</Typography>
              <TooltipWrapper
                tooltipContent={
                  <Tooltip className="raft__savings__infoTooltip">
                    <Typography variant="body2">No protocol fees when depositing or withdrawing.</Typography>
                  </Tooltip>
                }
                placement="top"
              >
                <Icon variant="info" size="tiny" />
              </TooltipWrapper>
            </div>
            <div className="raft__savings__transactionInfoValue">
              <ValueLabel value="Free" valueSize="body" />
            </div>
          </div>

          <ExecuteButton
            actionButtonState={actionButtonState}
            buttonLabel={buttonLabel}
            canExecute={canExecute}
            onClick={walletConnected ? onAction : onConnectWallet}
            walletConnected={walletConnected}
          />
        </div>
      </div>
      <div className="raft__savings__sidebar">
        <Stats currentSavings={currentUserSavings} />
        <FAQ />
      </div>
      <div className="raft__savings__sidebar-mobile">
        <Stats currentSavings={currentUserSavings} />
      </div>
    </div>
  );
};

export default memo(Savings);
