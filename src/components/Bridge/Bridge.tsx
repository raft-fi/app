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
  const toBalance = useMemo(() => new Decimal(123), []);
  const toBalanceAfter = useMemo(() => toBalance.add(amountDecimal), [amountDecimal, toBalance]);

  const fromBalanceFormatted = useMemo(
    () =>
      formatCurrency(fromBalance, {
        currency: R_TOKEN,
        fractionDigits: USD_UI_PRECISION,
      }),
    [fromBalance],
  );
  const toBalanceFormatted = useMemo(
    () =>
      formatCurrency(toBalance, {
        currency: R_TOKEN,
        fractionDigits: USD_UI_PRECISION,
      }),
    [toBalance],
  );
  const toBalanceAfterFormatted = useMemo(
    () =>
      formatCurrency(toBalanceAfter, {
        currency: R_TOKEN,
        fractionDigits: USD_UI_PRECISION,
      }),
    [toBalanceAfter],
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
          {/* TODO: use network logo */}
          <TokenLogo type="token-ETH" size={20} />
          <Typography variant="button-label">{toNetwork}</Typography>
        </div>
        <div className="raft__bridge__receive-amount__metadata">
          <div className="raft__bridge__receive-amount__metadata__entry">
            <Typography variant="caption" weight="medium" color="text-secondary">
              Current balance on {toNetwork}
            </Typography>
            <ValueLabel valueSize="caption" tickerSize="caption" value={toBalanceFormatted ?? '---'} />
          </div>
          <div className="raft__bridge__receive-amount__metadata__entry">
            <Typography variant="caption" weight="medium" color="text-secondary">
              Balance after transfer
            </Typography>
            <ValueLabel valueSize="caption" tickerSize="caption" value={toBalanceAfterFormatted ?? '---'} />
          </div>
          <div className="raft__bridge__receive-amount__metadata__entry">
            <Typography variant="caption" weight="medium" color="text-secondary">
              Time of arrival
            </Typography>
            <Typography variant="caption" weight="medium">
              ~1-2 minutes
            </Typography>
          </div>
          <div className="raft__bridge__receive-amount__metadata__entry">
            <div className="raft__bridge__receive-amount__metadata__entry-inner">
              <Typography variant="caption" weight="medium" color="text-secondary">
                Network fee
              </Typography>
              <Icon variant="info" size="tiny" />
            </div>
            <div className="raft__bridge__receive-amount__metadata__entry-inner">
              <ValueLabel valueSize="caption" tickerSize="caption" color="text-disabled" value="~$ 14.55" />
              <ValueLabel valueSize="caption" tickerSize="caption" value="~0.0013 ETH" />
            </div>
          </div>
          <div className="raft__bridge__receive-amount__metadata__entry">
            <div className="raft__bridge__receive-amount__metadata__entry-inner">
              <Typography variant="caption" weight="medium" color="text-secondary">
                CCIP fee
              </Typography>
              <Icon variant="info" size="tiny" />
            </div>
            <div className="raft__bridge__receive-amount__metadata__entry-inner">
              <ValueLabel valueSize="caption" tickerSize="caption" color="text-disabled" value="~$ 21.03" />
              <ValueLabel valueSize="caption" tickerSize="caption" value="~0.002 ETH" />
            </div>
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
