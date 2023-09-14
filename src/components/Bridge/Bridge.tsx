import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useConnectWallet } from '@web3-onboard/react';
import {
  R_TOKEN,
  SUPPORTED_BRIDGE_NETWORKS,
  BRIDGE_NETWORK_LANES,
  SupportedBridgeNetwork,
  BRIDGE_NETWORKS,
} from '@raft-fi/sdk';
import { Decimal } from '@tempusfinance/decimal';
import { ButtonWrapper, TokenLogo } from 'tempus-ui';
import { COLLATERAL_TOKEN_UI_PRECISION, INPUT_PREVIEW_DIGITS, USD_UI_PRECISION } from '../../constants';
import { formatCurrency } from '../../utils';
import {
  MAINNET_NETWORKS,
  NETWORK_IDS,
  NETWORK_LOGO_VARIANTS,
  NETWORK_NAMES,
  NETWORK_WALLET_CURRENCIES,
  NETWORK_WALLET_ENDPOINTS,
  TESTNET_NETWORKS,
} from '../../networks';
import {
  useBridgeBalances,
  useBridgeTokens,
  useEIP1193Provider,
  useEthPrice,
  useNetwork,
  useWallet,
} from '../../hooks';
import { CurrencyInput, ExecuteButton, Icon, Typography, ValueLabel } from '../shared';
import PoweredBy from './PoweredBy';
import NetworkSelector from './NetworkSelector';

import './Bridge.scss';

const Bridge = () => {
  let defaultFromNetwork: SupportedBridgeNetwork;
  let defaultToNetwork: SupportedBridgeNetwork;
  if (import.meta.env.VITE_BRIDGE_ENVIRONMENT === 'mainnet') {
    defaultFromNetwork = 'ethereum';
    defaultToNetwork = 'base';
  } else {
    defaultFromNetwork = 'ethereumSepolia';
    defaultToNetwork = 'arbitrumGoerli';
  }

  const [, connect] = useConnectWallet();
  const wallet = useWallet();
  const { network } = useNetwork();
  const eip1193Provider = useEIP1193Provider();
  const bridgeBalances = useBridgeBalances();
  const ethPrice = useEthPrice();
  const { bridgeTokensStatus, bridgeTokens, bridgeTokensStepsStatus, requestBridgeTokensStep } = useBridgeTokens();

  const [fromNetwork, setFromNetwork] = useState<SupportedBridgeNetwork>(defaultFromNetwork);
  const [toNetwork, setToNetwork] = useState<SupportedBridgeNetwork>(defaultToNetwork);
  const [amount, setAmount] = useState<string>('');
  const [actionButtonState, setActionButtonState] = useState<string>('default');

  const availableBridgeNetworks = useMemo(() => {
    return SUPPORTED_BRIDGE_NETWORKS.filter(network => {
      if (import.meta.env.VITE_BRIDGE_ENVIRONMENT === 'mainnet') {
        return MAINNET_NETWORKS.includes(network);
      } else {
        return TESTNET_NETWORKS.includes(network);
      }
    });
  }, []);

  const walletConnected = useMemo(() => Boolean(wallet), [wallet]);

  const gasEstimate = useMemo(
    () => bridgeTokensStepsStatus.result?.gasEstimate ?? null,
    [bridgeTokensStepsStatus.result?.gasEstimate],
  );
  const ccipFee = useMemo(
    () => bridgeTokensStepsStatus.result?.ccipFee ?? null,
    [bridgeTokensStepsStatus.result?.ccipFee],
  );
  const gasEstimateInUsd = useMemo(
    () => (gasEstimate && ethPrice ? gasEstimate.mul(ethPrice) : null),
    [ethPrice, gasEstimate],
  );
  const ccipFeeInUsd = useMemo(() => (ccipFee && ethPrice ? ccipFee.mul(ethPrice) : null), [ccipFee, ethPrice]);

  const gasEstimateFormatted = useMemo(
    () =>
      formatCurrency(gasEstimate, {
        currency: 'ETH',
        fractionDigits: COLLATERAL_TOKEN_UI_PRECISION,
        approximate: true,
      }),
    [gasEstimate],
  );
  const ccipFeeFormatted = useMemo(
    () =>
      formatCurrency(ccipFee, {
        currency: 'ETH',
        fractionDigits: COLLATERAL_TOKEN_UI_PRECISION,
        approximate: true,
      }),
    [ccipFee],
  );
  const gasEstimateInUsdFormatted = useMemo(
    () =>
      formatCurrency(gasEstimateInUsd, {
        currency: '$',
        fractionDigits: USD_UI_PRECISION,
        approximate: true,
      }),
    [gasEstimateInUsd],
  );
  const ccipFeeInUsdFormatted = useMemo(
    () =>
      formatCurrency(ccipFeeInUsd, {
        currency: '$',
        fractionDigits: USD_UI_PRECISION,
        approximate: true,
      }),
    [ccipFeeInUsd],
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
  }, [
    walletConnected,
    isWrongNetwork,
    executionSteps,
    executionType,
    hasInput,
    fromNetwork,
    bridgeTokensStatus.pending,
    currentExecutionSteps,
  ]);

  // TODO - Check if execute button should be enabled
  const canExecute = useMemo(() => {
    return true;
  }, []);

  const fromBridgeBalance = useMemo(() => {
    return bridgeBalances[fromNetwork];
  }, [bridgeBalances, fromNetwork]);

  const fromBridgeBalanceFormatted = useMemo(() => {
    return formatCurrency(fromBridgeBalance, {
      currency: BRIDGE_NETWORKS[fromNetwork].tokenTicker,
      fractionDigits: USD_UI_PRECISION,
    });
  }, [fromBridgeBalance, fromNetwork]);

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

  const onSwitchNetwork = useCallback(async () => {
    if (eip1193Provider) {
      try {
        // https://eips.ethereum.org/EIPS/eip-3326
        await eip1193Provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${NETWORK_IDS[fromNetwork].toString(16)}` }],
        });
      } catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((error as any).code === 4902) {
          // https://eips.ethereum.org/EIPS/eip-3085
          await eip1193Provider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${NETWORK_IDS[fromNetwork].toString(16)}`,
                chainName: NETWORK_NAMES[fromNetwork],
                rpcUrls: [NETWORK_WALLET_ENDPOINTS[fromNetwork]],
                nativeCurrency: NETWORK_WALLET_CURRENCIES[fromNetwork],
              },
            ],
          });
        } else {
          console.error(`Failed to switch network to ${fromNetwork}`);
        }
      }
    }
  }, [eip1193Provider, fromNetwork]);

  const onAction = useCallback(() => {
    bridgeTokens?.();
  }, [bridgeTokens]);

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
    requestBridgeTokensStep?.({
      amountToBridge: amountDecimal,
      destinationChainName: toNetwork,
      sourceChainName: fromNetwork,
    });
  }, [requestBridgeTokensStep, wallet, amountDecimal, toNetwork, fromNetwork]);

  useEffect(() => {
    setToNetwork(BRIDGE_NETWORK_LANES[fromNetwork][0]);
  }, [fromNetwork]);

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
            networks={availableBridgeNetworks}
            selectedNetwork={fromNetwork}
            onNetworkChange={setFromNetwork}
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
        <div className="raft__bridge__fees__value">
          <Icon variant="ccip" size="small" />
          <ValueLabel valueSize="body" tickerSize="caption" value={ccipFeeFormatted ?? 'N/A'} />
          {ccipFeeInUsdFormatted && (
            <div className="raft__bridge__fees__value-container">
              <Typography variant="body" weight="medium" color="text-secondary">
                (
              </Typography>
              <ValueLabel valueSize="body" tickerSize="caption" value={ccipFeeInUsdFormatted} color="text-secondary" />
              <Typography variant="body" weight="medium" color="text-secondary">
                )
              </Typography>
            </div>
          )}
        </div>
      </div>
      <ExecuteButton
        actionButtonState={actionButtonState}
        buttonLabel={buttonLabel}
        canExecute={canExecute}
        onClick={onExecute}
        walletConnected={walletConnected}
      />
    </div>
  );
};

export default memo(Bridge);
