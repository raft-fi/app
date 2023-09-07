import { memo, useCallback, useMemo, useState } from 'react';
import { Button, Icon, Typography, ValueLabel } from '../shared';
import PoweredBy from './PoweredBy';
import NetworkSelector from './NetworkSelector';

import './Bridge.scss';
import { SUPPORTED_BRIDGE_NETWORKS, USD_UI_PRECISION } from '../../constants';
import { SupportedBridgeNetwork } from '../../interfaces';
import { ButtonWrapper, TokenLogo } from 'tempus-ui';
import AmountInput from './AmountInput';
import { R_TOKEN } from '@raft-fi/sdk';
import { Decimal } from '@tempusfinance/decimal';
import { formatCurrency } from '../../utils';
import { useConnectWallet } from '@web3-onboard/react';

const Bridge = () => {
  const [, connect] = useConnectWallet();
  const [fromNetwork, setFromNetwork] = useState<SupportedBridgeNetwork>('ethereum');
  const [toNetwork, setToNetwork] = useState<SupportedBridgeNetwork>('base');
  const [amount, setAmount] = useState<string>('');

  const amountDeciaml = useMemo(() => Decimal.parse(amount, 0), [amount]);

  // TODO: hardcode balance for now
  const fromBalance = useMemo(() => new Decimal(123), []);
  const toBalance = useMemo(() => new Decimal(123), []);
  const toBalanceAfter = useMemo(() => toBalance.add(amountDeciaml), [amountDeciaml, toBalance]);

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

  const onSwapNetwork = useCallback(() => {
    setFromNetwork(toNetwork);
    setToNetwork(fromNetwork);
  }, [fromNetwork, toNetwork]);

  const onMaxAmount = useCallback(() => setAmount(fromBalance.toString()), [fromBalance]);
  const onConnectWallet = useCallback(() => {
    connect();
  }, [connect]);

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
        <AmountInput
          value={amount}
          balance={fromBalanceFormatted ?? undefined}
          onChange={setAmount}
          onMax={onMaxAmount}
          token={R_TOKEN}
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
      <div className="raft__bridge__btn-container">
        <Button variant="primary" size="large" onClick={onConnectWallet}>
          <Typography variant="button-label" color="text-primary-inverted">
            Connect wallet
          </Typography>
        </Button>
      </div>
    </div>
  );
};

export default memo(Bridge);
