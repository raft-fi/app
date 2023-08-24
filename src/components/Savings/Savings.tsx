import { MouseEvent, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Decimal } from '@tempusfinance/decimal';
import { useConnectWallet } from '@web3-onboard/react';
import { ButtonWrapper } from 'tempus-ui';
import { useAppLoaded, useManageSavings, useWallet } from '../../hooks';
import { Button, CurrencyInput, Icon, Loading, Tooltip, TooltipWrapper, Typography } from '../shared';
import LoadingSavings from '../LoadingSavings';
import FAQ from '../FAQ';

import './Savings.scss';

const Savings = () => {
  const [, connect] = useConnectWallet();

  const appLoaded = useAppLoaded();
  const wallet = useWallet();
  const { manageSavingsStatus, manageSavings, manageSavingsStepsStatus, requestManageSavingsStep } = useManageSavings();

  const [transactionState] = useState<string>('default');
  const [isAddCollateral, setIsAddCollateral] = useState<boolean>(true);
  const [amount, setAmount] = useState<string>('');

  const amountParsed = useMemo(() => {
    return Decimal.parse(amount, 0);
  }, [amount]);

  useEffect(() => {
    requestManageSavingsStep?.({
      amount: amountParsed,
    });
  }, [amountParsed, requestManageSavingsStep]);

  const handleSwitchCollateralAction = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    const addCollateral = event.currentTarget.getAttribute('data-id') === 'addCollateral';
    setIsAddCollateral(addCollateral);
  }, []);

  const handleCollateralValueUpdate = useCallback((amount: string) => {
    setAmount(amount);
  }, []);

  const walletConnected = useMemo(() => Boolean(wallet), [wallet]);

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

  const buttonLabel = useMemo(() => {
    if (!walletConnected) {
      return 'Connect wallet';
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

    // executionType is null but input non-empty, still loading
    return 'Loading';
  }, [
    walletConnected,
    manageSavingsStatus.pending,
    executionSteps,
    executionType,
    hasNonEmptyInput,
    currentExecutionSteps,
  ]);

  const subHeaderLabel = useMemo(() => {
    if (isAddCollateral) {
      return 'Deposit R to earn more R.';
    }

    return 'Withdraw your savings and earned rewards.';
  }, [isAddCollateral]);

  const onAction = useCallback(() => {
    manageSavings?.();
  }, [manageSavings]);

  const onConnectWallet = useCallback(() => {
    connect();
  }, [connect]);

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

          <div className="raft__savings__action">
            <Button
              variant="primary"
              size="large"
              onClick={walletConnected ? onAction : onConnectWallet}
              disabled={false}
            >
              {transactionState === 'loading' && <Loading />}
              <Typography variant="button-label" color="text-primary-inverted">
                {buttonLabel}
              </Typography>
            </Button>
          </div>
        </div>
      </div>
      <div className="raft__savings__right">
        <div className="raft__savings__stats">XX</div>
        <div className="raft__savings__faqs">
          <FAQ />
        </div>
      </div>
    </div>
  );
};

export default memo(Savings);
