import { MouseEvent, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Decimal } from '@tempusfinance/decimal';
import { useConnectWallet } from '@web3-onboard/react';
import { R_TOKEN } from '@raft-fi/sdk';
import { ButtonWrapper } from 'tempus-ui';
import {
  useAppLoaded,
  useManageSavings,
  useNetwork,
  useSavingsMaxDeposit,
  useTokenBalances,
  useWallet,
} from '../../hooks';
import { formatCurrency } from '../../utils';
import { CurrencyInput, ExecuteButton, Icon, Tooltip, TooltipWrapper, Typography } from '../shared';
import LoadingSavings from '../LoadingSavings';
import FAQ from './FAQ';
import Stats from './Stats';

import './Savings.scss';

const Savings = () => {
  const [, connect] = useConnectWallet();

  const appLoaded = useAppLoaded();
  const { isWrongNetwork } = useNetwork();
  const wallet = useWallet();
  const tokenBalanceMap = useTokenBalances();
  const savingsMaxDeposit = useSavingsMaxDeposit();
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
    });
  }, [amountParsed, isAddCollateral, requestManageSavingsStep]);

  const handleSwitchCollateralAction = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    const addCollateral = event.currentTarget.getAttribute('data-id') === 'addCollateral';
    setIsAddCollateral(addCollateral);
  }, []);

  const handleCollateralValueUpdate = useCallback((amount: string) => {
    setAmount(amount);
  }, []);

  const walletConnected = useMemo(() => Boolean(wallet), [wallet]);

  const rTokenBalance = useMemo(() => tokenBalanceMap[R_TOKEN], [tokenBalanceMap]);

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

  const hasEnoughRTokenBalance = useMemo(() => {
    // In case R token balance is still loading
    if (!rTokenBalance) {
      return false;
    }

    return amountParsed.lte(rTokenBalance);
  }, [amountParsed, rTokenBalance]);

  const isPositionWithinDepositCap = useMemo(() => {
    // In case savingsMaxDeposit is still loading
    if (!savingsMaxDeposit) {
      return false;
    }

    return amountParsed.lte(savingsMaxDeposit);
  }, [amountParsed, savingsMaxDeposit]);

  // TODO - Handle withdraw error messages inside this hook
  const buttonLabel = useMemo(() => {
    if (!walletConnected) {
      return 'Connect wallet';
    }

    if (isWrongNetwork) {
      return 'Unsupported network';
    }

    if (!hasEnoughRTokenBalance) {
      return 'Insufficient funds';
    }

    if (!isPositionWithinDepositCap) {
      return 'Deposit capacity reached, please try again later';
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
    hasEnoughRTokenBalance,
    isPositionWithinDepositCap,
    executionSteps,
    executionType,
    hasNonEmptyInput,
    manageSavingsStatus.pending,
    currentExecutionSteps,
  ]);

  const subHeaderLabel = useMemo(() => {
    if (isAddCollateral) {
      return 'Deposit R to earn more R.';
    }

    return 'Withdraw your savings and earned rewards.';
  }, [isAddCollateral]);

  const hasInputFilled = useMemo(() => !amountParsed.isZero(), [amountParsed]);

  const canExecuteDeposit = useMemo(
    () => Boolean(hasInputFilled && hasEnoughRTokenBalance && !isWrongNetwork && isPositionWithinDepositCap),
    [hasEnoughRTokenBalance, hasInputFilled, isPositionWithinDepositCap, isWrongNetwork],
  );

  const canExecuteWithdraw = useMemo(() => {
    // TODO - Handle withdraw disabled state
    return true;
  }, []);

  const canExecute = useMemo(() => {
    if (isAddCollateral) {
      return canExecuteDeposit;
    }
    return canExecuteWithdraw;
  }, [canExecuteDeposit, canExecuteWithdraw, isAddCollateral]);

  const errorMessageWithdraw = useMemo(() => {
    // TODO - Handle withdraw error messages
    return '';
  }, []);

  const errorMessageDeposit = useMemo(() => {
    if (!walletConnected) {
      return;
    }

    if (!hasEnoughRTokenBalance) {
      return 'Insufficient funds';
    }

    if (isWrongNetwork) {
      return 'You are connected to unsupported network. Please switch to Ethereum Mainnet.';
    }

    if (!isPositionWithinDepositCap) {
      const maxDeposit = formatCurrency(savingsMaxDeposit, {
        currency: R_TOKEN,
        fractionDigits: 2,
      });

      return `Deposit amount exceeds max deposit amount of ${maxDeposit}. Please reduce the deposit amount.`;
    }
  }, [hasEnoughRTokenBalance, isPositionWithinDepositCap, isWrongNetwork, savingsMaxDeposit, walletConnected]);

  const errorMessage = useMemo(() => {
    if (isAddCollateral) {
      return errorMessageDeposit;
    }
    return errorMessageWithdraw;
  }, [errorMessageDeposit, errorMessageWithdraw, isAddCollateral]);

  const onAction = useCallback(() => {
    manageSavings?.();
  }, [manageSavings]);

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

  if (!appLoaded) {
    return (
      <div className="raft__savings__container">
        <LoadingSavings />
      </div>
    );
  }

  return (
    <div className="raft__savings__container">
      <div className="raft__savings__left">
        <div className="raft__savings">
          <Typography variant="heading2" weight="medium">
            Earn
          </Typography>
          <div className="raft__savings__subheader">
            <Typography variant="menu-item" weight="regular" color="text-secondary">
              {subHeaderLabel}
            </Typography>
          </div>

          <div className="raft__savings__input">
            <CurrencyInput
              label={rInputLabelComponent}
              precision={18}
              selectedToken={'R'}
              tokens={['R']}
              value={amount}
              maxAmount={Decimal.ONE}
              onValueUpdate={handleCollateralValueUpdate}
              error={Boolean(errorMessage)}
              errorMsg={errorMessage}
            />
          </div>

          <div className="raft__savings__extraData">
            <div className="raft__savings__extraDataTitle">
              <Typography variant="overline">TITLE</Typography>
              <TooltipWrapper
                tooltipContent={
                  <Tooltip className="raft__savings__infoTooltip">
                    <Typography variant="body2">Activated charcoal paleo selvage synth hexagon.</Typography>
                  </Tooltip>
                }
                placement="top"
              >
                <Icon variant="info" size="tiny" />
              </TooltipWrapper>
            </div>

            <Typography variant="overline">N/A</Typography>
          </div>

          <div className="raft__savings__extraData">
            <div className="raft__savings__extraDataTitle">
              <Typography variant="overline">TITLE 2</Typography>
              <TooltipWrapper
                tooltipContent={
                  <Tooltip className="raft__savings__infoTooltip">
                    <Typography variant="body2">
                      Next level roof party bicycle rights same big mood, artisan VHS quinoa polaroid art party
                      mustache.
                    </Typography>
                  </Tooltip>
                }
                placement="top"
              >
                <Icon variant="info" size="tiny" />
              </TooltipWrapper>
            </div>

            <Typography variant="overline">N/A</Typography>
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
      <div className="raft__savings__right">
        <Stats />
        <FAQ />
      </div>
    </div>
  );
};

export default memo(Savings);
