import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useConnectWallet } from '@web3-onboard/react';
import { R_TOKEN, SUPPORTED_BRIDGE_NETWORKS, SupportedBridgeNetworks } from '@raft-fi/sdk';
import { Decimal } from '@tempusfinance/decimal';
import { ButtonWrapper, TokenLogo } from 'tempus-ui';
import { INPUT_PREVIEW_DIGITS, USD_UI_PRECISION } from '../../constants';
import { formatCurrency } from '../../utils';
import { useBridgeTokens, useWallet } from '../../hooks';
import { CurrencyInput, ExecuteButton, Icon, Typography, ValueLabel } from '../shared';
import PoweredBy from './PoweredBy';
import NetworkSelector from './NetworkSelector';

import './Bridge.scss';
import { NETWORK_LOGO_VARIANTS, NETWORK_NAMES } from '../../networks';

const Bridge = () => {
  const [, connect] = useConnectWallet();
  const wallet = useWallet();
  const { bridgeTokensStatus, bridgeTokens, bridgeTokensStepsStatus, requestBridgeTokensStep } = useBridgeTokens();

  const [fromNetwork, setFromNetwork] = useState<SupportedBridgeNetworks>('ethereum');
  const [toNetwork, setToNetwork] = useState<SupportedBridgeNetworks>('base');
  const [amount, setAmount] = useState<string>('');
  const [actionButtonState, setActionButtonState] = useState<string>('default');

  const walletConnected = useMemo(() => Boolean(wallet), [wallet]);

  const executionSteps = useMemo(
    () => bridgeTokensStepsStatus.result?.numberOfSteps,
    [bridgeTokensStepsStatus.result?.numberOfSteps],
  );

  const currentExecutionSteps = useMemo(
    () => bridgeTokensStepsStatus.result?.stepNumber,
    [bridgeTokensStepsStatus.result?.stepNumber],
  );

  const executionType = useMemo(
    () => bridgeTokensStepsStatus.result?.type?.name ?? null,
    [bridgeTokensStepsStatus.result?.type],
  );

  const amountDecimal = useMemo(() => Decimal.parse(amount, 0), [amount]);

  const hasInput = useMemo(() => !amountDecimal.isZero(), [amountDecimal]);

  const amountWithEllipse = useMemo(() => {
    const original = amountDecimal.toString();
    const truncated = amountDecimal.toTruncated(INPUT_PREVIEW_DIGITS);

    return original === truncated ? original : `${truncated}...`;
  }, [amountDecimal]);

  // TODO: hardcode balance for now
  const fromBalance = useMemo(() => new Decimal(123), []);

  const fromBalanceFormatted = useMemo(
    () =>
      formatCurrency(fromBalance, {
        currency: R_TOKEN,
        fractionDigits: USD_UI_PRECISION,
      }),
    [fromBalance],
  );

  // TODO - Handle withdraw error messages inside this hook
  const buttonLabel = useMemo(() => {
    if (!walletConnected) {
      return 'Connect wallet';
    }

    if (executionSteps === 1) {
      return bridgeTokensStatus.pending ? 'Executing' : 'Execute';
    }

    if (executionType === 'approve') {
      return bridgeTokensStatus.pending
        ? `Approving R (${currentExecutionSteps}/${executionSteps})`
        : `Approve R (${currentExecutionSteps}/${executionSteps})`;
    }

    if (executionType === 'bridgeTokens') {
      return bridgeTokensStatus.pending
        ? `Executing (${currentExecutionSteps}/${executionSteps})`
        : `Execute (${currentExecutionSteps}/${executionSteps})`;
    }

    // input is still empty, showing default button text
    if (!hasInput) {
      return 'Execute';
    }

    return 'Execute';
  }, [walletConnected, executionSteps, executionType, hasInput, bridgeTokensStatus.pending, currentExecutionSteps]);

  // TODO - Check if execute button should be enabled
  const canExecute = useMemo(() => {
    return true;
  }, []);

  const onSwapNetwork = useCallback(() => {
    setFromNetwork(toNetwork);
    setToNetwork(fromNetwork);
  }, [fromNetwork, toNetwork]);

  const onMaxAmount = useCallback(() => setAmount(fromBalance.toString()), [fromBalance]);
  const onConnectWallet = useCallback(() => {
    connect();
  }, [connect]);

  const onAction = useCallback(() => {
    bridgeTokens?.();
  }, [bridgeTokens]);

  /**
   * Update action button state based on current approve/borrow request status
   */
  useEffect(() => {
    if (bridgeTokensStatus.pending || bridgeTokensStepsStatus.pending) {
      setActionButtonState('loading');
    } else {
      setActionButtonState('default');
    }
  }, [bridgeTokensStatus.pending, bridgeTokensStepsStatus.pending]);

  useEffect(() => {
    // In case user is withdrawing we need to set negative amount value.
    requestBridgeTokensStep?.({
      amountToBridge: amountDecimal,
      destinationChainName: toNetwork,
      sourceChainName: fromNetwork,
    });
  }, [requestBridgeTokensStep, wallet, amountDecimal, toNetwork, fromNetwork]);

  return (
    <div className="raft__bridge">
      <div className="raft__bridge__title">
        <Typography variant="heading2" weight="medium">
          Bridge
        </Typography>
        <PoweredBy />
      </div>
      <div className="raft__bridge__network">
        <div className="raft__bridge__network-selector">
          <Typography variant="overline" weight="semi-bold" color="text-secondary">
            FROM
          </Typography>
          <NetworkSelector
            networks={SUPPORTED_BRIDGE_NETWORKS}
            selectedNetwork={fromNetwork}
            onNetworkChange={setFromNetwork}
          />
        </div>
        <ButtonWrapper className="raft__bridge__network-swap" onClick={onSwapNetwork}>
          <Icon variant="swap" size="small" />
        </ButtonWrapper>
        <div className="raft__bridge__network-selector">
          <Typography variant="overline" weight="semi-bold" color="text-secondary">
            TO
          </Typography>
          <NetworkSelector
            networks={SUPPORTED_BRIDGE_NETWORKS}
            selectedNetwork={toNetwork}
            onNetworkChange={setToNetwork}
          />
        </div>
      </div>
      <div className="raft__bridge__send-amount">
        <CurrencyInput
          label="YOU SEND"
          precision={18}
          selectedToken={R_TOKEN}
          tokens={[R_TOKEN]}
          value={amount}
          previewValue={amountWithEllipse}
          maxAmount={fromBalance}
          maxAmountFormatted={fromBalanceFormatted ?? undefined}
          onValueUpdate={setAmount}
          onMaxAmountClick={onMaxAmount}
        />
      </div>
      <div className="raft__bridge__receive-amount">
        <Typography
          className="raft__bridge__receive-amount__label"
          variant="overline"
          weight="semi-bold"
          color="text-secondary"
        >
          YOU RECEIVE
        </Typography>
        <div className="raft__bridge__receive-amount__value">
          <TokenLogo type={`token-${R_TOKEN}`} size={20} />
          <Typography variant="input-value">{amount || '0.00'}</Typography>
          <Typography variant="button-label">on</Typography>
          <TokenLogo type={NETWORK_LOGO_VARIANTS[toNetwork]} size={20} />
          <Typography variant="button-label">{NETWORK_NAMES[toNetwork]}</Typography>
        </div>
      </div>
      <div className="raft__bridge__time">
        <div className="raft__bridge__time__label">
          <Typography variant="overline" weight="semi-bold" color="text-secondary">
            TIME TO ARRIVAL
          </Typography>
          <Icon variant="info" size="tiny" />
        </div>
        <Typography className="raft__bridge__time__value" variant="body" weight="medium">
          ~1-2 minutes
        </Typography>
      </div>
      <div className="raft__bridge__fees">
        <div className="raft__bridge__fees__label">
          <Typography variant="overline" weight="semi-bold" color="text-secondary">
            FEES
          </Typography>
          <Icon variant="info" size="tiny" />
        </div>
        <div className="raft__bridge__fees__value">
          <Icon variant="gas" size="small" />
          <ValueLabel valueSize="body" tickerSize="caption" value="~0.0013 ETH" />
          <div className="raft__bridge__fees__value-container">
            <Typography variant="body" weight="medium" color="text-secondary">
              (~
            </Typography>
            <ValueLabel valueSize="body" tickerSize="caption" value="$14.55" color="text-secondary" />
            <Typography variant="body" weight="medium" color="text-secondary">
              )
            </Typography>
          </div>
        </div>
        <div className="raft__bridge__fees__value">
          <Icon variant="ccip" size="small" />
          <ValueLabel valueSize="body" tickerSize="caption" value="~0.0013 ETH" />
          <div className="raft__bridge__fees__value-container">
            <Typography variant="body" weight="medium" color="text-secondary">
              (~
            </Typography>
            <ValueLabel valueSize="body" tickerSize="caption" value="$14.55" color="text-secondary" />
            <Typography variant="body" weight="medium" color="text-secondary">
              )
            </Typography>
          </div>
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
  );
};

export default memo(Bridge);
