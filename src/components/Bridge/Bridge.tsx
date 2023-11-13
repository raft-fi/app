import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useConnectWallet } from '@web3-onboard/react';
import {
  R_TOKEN,
  BRIDGE_NETWORK_LANES,
  SupportedBridgeNetwork,
  BRIDGE_NETWORKS,
  isSupportedBridgeNetwork,
} from '@raft-fi/sdk';
import { Decimal } from '@tempusfinance/decimal';
import { ButtonWrapper, TokenLogo } from '@tempusfinance/common-ui';
import { COLLATERAL_TOKEN_UI_PRECISION, INPUT_PREVIEW_DIGITS, USD_UI_PRECISION } from '../../constants';
import { formatCurrency, switchNetwork } from '../../utils';
import { NETWORK_IDS, NETWORK_LOGO_VARIANTS, NETWORK_NAMES, SUPPORTED_BRIDGE_NETWORKS } from '../../networks';
import {
  useBridgeBalances,
  useBridgeLoaded,
  useBridgeTokens,
  useEIP1193Provider,
  useEthPrice,
  useNetwork,
  useWallet,
} from '../../hooks';
import {
  CurrencyInput,
  ExecuteButton,
  Icon,
  Typography,
  ValueLabel,
  NetworkSelector,
  TooltipWrapper,
  Tooltip,
} from '../shared';
import PoweredBy from './PoweredBy';

import './Bridge.scss';
import { LoadingBridge } from '../LoadingPage';

const Bridge = () => {
  const [, connect] = useConnectWallet();
  const wallet = useWallet();
  const { network } = useNetwork();
  const bridgeLoaded = useBridgeLoaded();
  const eip1193Provider = useEIP1193Provider();
  const bridgeBalances = useBridgeBalances();
  const ethPrice = useEthPrice();
  const { bridgeTokensStatus, bridgeTokens, bridgeTokensStepsStatus, requestBridgeTokensStep } = useBridgeTokens();

  const [fromNetwork, setFromNetwork] = useState<SupportedBridgeNetwork>(SUPPORTED_BRIDGE_NETWORKS[0]);
  const [toNetwork, setToNetwork] = useState<SupportedBridgeNetwork>(SUPPORTED_BRIDGE_NETWORKS[1]);
  const [amount, setAmount] = useState<string>('');
  const [actionButtonState, setActionButtonState] = useState<string>('default');

  const walletConnected = useMemo(() => Boolean(wallet), [wallet]);

  const gasEstimate = useMemo(
    () => bridgeTokensStepsStatus.result?.gasEstimate ?? null,
    [bridgeTokensStepsStatus.result?.gasEstimate],
  );
  const bridgeFee = useMemo(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => (bridgeTokensStepsStatus.result as any)?.bridgeFee ?? null,
    [bridgeTokensStepsStatus.result],
  );
  const gasEstimateInUsd = useMemo(
    () => (gasEstimate && ethPrice ? gasEstimate.mul(ethPrice) : null),
    [ethPrice, gasEstimate],
  );
  const bridgeFeeInUsd = useMemo(() => (bridgeFee && ethPrice ? bridgeFee.mul(ethPrice) : null), [bridgeFee, ethPrice]);

  const gasEstimateFormatted = useMemo(
    () =>
      formatCurrency(gasEstimate, {
        currency: 'ETH',
        fractionDigits: COLLATERAL_TOKEN_UI_PRECISION,
        approximate: true,
        lessThanFormat: true,
      }),
    [gasEstimate],
  );
  const bridgeFeeFormatted = useMemo(
    () =>
      formatCurrency(bridgeFee, {
        currency: 'ETH',
        fractionDigits: COLLATERAL_TOKEN_UI_PRECISION,
        approximate: true,
        lessThanFormat: true,
      }),
    [bridgeFee],
  );
  const gasEstimateInUsdFormatted = useMemo(
    () =>
      formatCurrency(gasEstimateInUsd, {
        currency: '$',
        fractionDigits: USD_UI_PRECISION,
        approximate: true,
        lessThanFormat: true,
      }),
    [gasEstimateInUsd],
  );
  const bridgeFeeInUsdFormatted = useMemo(
    () =>
      formatCurrency(bridgeFeeInUsd, {
        currency: '$',
        fractionDigits: USD_UI_PRECISION,
        approximate: true,
        lessThanFormat: true,
      }),
    [bridgeFeeInUsd],
  );

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

  const isWrongNetwork = useMemo(
    () => network?.chainId.toString() !== String(NETWORK_IDS[fromNetwork]),
    [fromNetwork, network?.chainId],
  );

  // TODO - Handle withdraw error messages inside this hook
  const buttonLabel = useMemo(() => {
    if (!walletConnected) {
      return 'Connect wallet';
    }

    if (isWrongNetwork) {
      return `Switch to ${NETWORK_NAMES[fromNetwork]}`;
    }

    if (bridgeTokensStepsStatus.error) {
      return 'Something has gone wrong, please try again';
    }

    if (executionSteps === 1) {
      return bridgeTokensStatus.pending ? 'Executing' : 'Execute';
    }

    if (executionType === 'approve') {
      return bridgeTokensStatus.pending
        ? `Approving R (${currentExecutionSteps}/${executionSteps})`
        : `Approve R (${currentExecutionSteps}/${executionSteps})`;
    }

    if (executionType === 'bridge') {
      return bridgeTokensStatus.pending
        ? `Executing (${currentExecutionSteps}/${executionSteps})`
        : `Execute (${currentExecutionSteps}/${executionSteps})`;
    }

    // input is still empty, showing default button text
    if (!hasInput) {
      return 'Execute';
    }

    return 'Execute';
  }, [
    walletConnected,
    isWrongNetwork,
    bridgeTokensStepsStatus.error,
    executionSteps,
    executionType,
    hasInput,
    fromNetwork,
    bridgeTokensStatus.pending,
    currentExecutionSteps,
  ]);

  const fromBridgeBalance = useMemo(() => bridgeBalances[fromNetwork], [bridgeBalances, fromNetwork]);

  const fromBridgeBalanceFormatted = useMemo(
    () =>
      formatCurrency(fromBridgeBalance, {
        currency: BRIDGE_NETWORKS[fromNetwork].tokenTicker,
        fractionDigits: USD_UI_PRECISION,
      }),
    [fromBridgeBalance, fromNetwork],
  );

  const isInputValid = useMemo(
    () => !amountDecimal.isZero() && fromBridgeBalance?.gte(amountDecimal),
    [amountDecimal, fromBridgeBalance],
  );
  const canExecute = useMemo(
    () => isInputValid && !isWrongNetwork && !bridgeTokensStepsStatus.error,
    [bridgeTokensStepsStatus.error, isInputValid, isWrongNetwork],
  );
  // enable button if input is non-zero, or user need to switch network
  const isButtonEnabled = useMemo(
    () => (isInputValid || isWrongNetwork) && !bridgeTokensStepsStatus.error,
    [bridgeTokensStepsStatus.error, isInputValid, isWrongNetwork],
  );

  const onSwapNetwork = useCallback(() => {
    setFromNetwork(toNetwork);
    setToNetwork(fromNetwork);
  }, [fromNetwork, toNetwork]);

  const onMaxAmount = useCallback(() => {
    if (!fromBridgeBalance) {
      return;
    }

    setAmount(fromBridgeBalance.toString());
  }, [fromBridgeBalance]);

  const onConnectWallet = useCallback(() => {
    connect();
  }, [connect]);

  const onSwitchNetwork = useCallback(
    () => switchNetwork(eip1193Provider, fromNetwork),
    [eip1193Provider, fromNetwork],
  );

  const onAction = useCallback(() => {
    if (canExecute) {
      bridgeTokens?.();
    }
  }, [bridgeTokens, canExecute]);

  const handleFromNetworkChange = useCallback((value: string) => {
    if (isSupportedBridgeNetwork(value)) {
      setFromNetwork(value);
    }
  }, []);

  const handleToNetworkChange = useCallback((value: string) => {
    if (isSupportedBridgeNetwork(value)) {
      setToNetwork(value);
    }
  }, []);

  const onExecute = useMemo(() => {
    if (!walletConnected) {
      return onConnectWallet;
    }

    if (isWrongNetwork) {
      return onSwitchNetwork;
    }

    return onAction;
  }, [isWrongNetwork, onAction, onConnectWallet, onSwitchNetwork, walletConnected]);

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
    if (!isWrongNetwork) {
      requestBridgeTokensStep?.({
        amountToBridge: amountDecimal,
        destinationChainName: toNetwork,
        sourceChainName: fromNetwork,
      });
    } else {
      requestBridgeTokensStep?.({
        amountToBridge: Decimal.ZERO,
        destinationChainName: toNetwork,
        sourceChainName: fromNetwork,
      });
    }
  }, [requestBridgeTokensStep, amountDecimal, toNetwork, fromNetwork, isWrongNetwork]);

  useEffect(() => {
    setToNetwork(BRIDGE_NETWORK_LANES[fromNetwork][0]);
  }, [fromNetwork]);

  if (!bridgeLoaded) {
    return <LoadingBridge />;
  }

  return (
    <div className="raft__bridge">
      <div className="raft__bridge__title">
        <Typography variant="heading2" weight="medium">
          Bridge
        </Typography>
        <PoweredBy />
      </div>
      <div className="raft__bridge__network">
        <div className="raft__bridge__network-selector-container">
          <Typography variant="overline" weight="semi-bold" color="text-secondary">
            FROM
          </Typography>
          <NetworkSelector
            networks={SUPPORTED_BRIDGE_NETWORKS}
            selectedNetwork={fromNetwork}
            onNetworkChange={handleFromNetworkChange}
          />
        </div>
        <ButtonWrapper className="raft__bridge__network-swap" onClick={onSwapNetwork}>
          <Icon variant="swap" size="small" />
        </ButtonWrapper>
        <div className="raft__bridge__network-selector-container">
          <Typography variant="overline" weight="semi-bold" color="text-secondary">
            TO
          </Typography>
          <NetworkSelector
            networks={BRIDGE_NETWORK_LANES[fromNetwork]}
            selectedNetwork={toNetwork}
            align="right"
            onNetworkChange={handleToNetworkChange}
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
          maxAmount={fromBridgeBalance}
          maxAmountFormatted={fromBridgeBalanceFormatted ?? undefined}
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
          <TooltipWrapper
            tooltipContent={
              <Tooltip className="raft__bridge__infoTooltip">
                <Typography variant="body2">
                  Estimated time for your funds to arrive at the selected destination chain.
                </Typography>
              </Tooltip>
            }
            placement="top"
          >
            <Icon variant="info" size="tiny" />
          </TooltipWrapper>
        </div>
        <Typography className="raft__bridge__time__value" variant="body" weight="medium">
          &lt;20 minutes
        </Typography>
      </div>
      <div className="raft__bridge__fees">
        <div className="raft__bridge__fees__label">
          <Typography variant="overline" weight="semi-bold" color="text-secondary">
            FEES
          </Typography>
          <TooltipWrapper
            tooltipContent={
              <Tooltip className="raft__bridge__infoTooltip">
                <Typography variant="body2">Estimated bridging fee associated with your transaction.</Typography>
              </Tooltip>
            }
            placement="top"
          >
            <Icon variant="info" size="tiny" />
          </TooltipWrapper>
        </div>
        <div className="raft__bridge__fees__value">
          <Icon variant="gas" size="small" />
          <ValueLabel valueSize="body" tickerSize="caption" value={gasEstimateFormatted ?? 'N/A'} />
          {gasEstimateInUsdFormatted && (
            <div className="raft__bridge__fees__value-container">
              <Typography variant="body" weight="medium" color="text-secondary">
                (
              </Typography>
              <ValueLabel
                valueSize="body"
                tickerSize="caption"
                value={gasEstimateInUsdFormatted}
                color="text-secondary"
              />
              <Typography variant="body" weight="medium" color="text-secondary">
                )
              </Typography>
            </div>
          )}
        </div>
        {bridgeFee && (
          <div className="raft__bridge__fees__value">
            <Icon variant="ccip" size="small" />
            <ValueLabel valueSize="body" tickerSize="caption" value={bridgeFeeFormatted ?? 'N/A'} />
            {bridgeFeeInUsdFormatted && (
              <div className="raft__bridge__fees__value-container">
                <Typography variant="body" weight="medium" color="text-secondary">
                  (
                </Typography>
                <ValueLabel
                  valueSize="body"
                  tickerSize="caption"
                  value={bridgeFeeInUsdFormatted}
                  color="text-secondary"
                />
                <Typography variant="body" weight="medium" color="text-secondary">
                  )
                </Typography>
              </div>
            )}
          </div>
        )}
      </div>
      <ExecuteButton
        actionButtonState={actionButtonState}
        buttonLabel={buttonLabel}
        canExecute={isButtonEnabled}
        onClick={onExecute}
        walletConnected={walletConnected}
      />
    </div>
  );
};

export default memo(Bridge);
