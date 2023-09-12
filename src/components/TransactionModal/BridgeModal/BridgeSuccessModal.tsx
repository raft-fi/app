import { R_TOKEN, SupportedBridgeNetwork } from '@raft-fi/sdk';
import { Decimal } from '@tempusfinance/decimal';
import { FC, memo, useCallback, useMemo } from 'react';
import { Link, TokenLogo } from 'tempus-ui';
import { USD_UI_PRECISION } from '../../../constants';
import { useConfig, useEIP1193Provider } from '../../../hooks';
import { Nullable } from '../../../interfaces';
import { NETWORK_LOGO_VARIANTS, NETWORK_NAMES } from '../../../networks';
import { formatCurrency } from '../../../utils';
import { Button, Icon, ModalWrapper, Typography } from '../../shared';

import './BridgeModal.scss';

interface BridgeSuccessModalProps {
  open: boolean;
  fromNetwork: SupportedBridgeNetwork;
  toNetwork: SupportedBridgeNetwork;
  amount: Decimal;
  messageId?: string;
  tokenToAdd: Nullable<{
    label: string;
    address: string;
    symbol: string;
    decimals: number;
    image: string;
  }>;
  onClose: () => void;
}

const BridgeSuccessModal: FC<BridgeSuccessModalProps> = ({
  open,
  fromNetwork,
  toNetwork,
  amount,
  messageId,
  tokenToAdd,
  onClose,
}) => {
  const eip1193Provider = useEIP1193Provider();
  const config = useConfig();

  const onAddTokenToWallet = useCallback(() => {
    if (eip1193Provider && tokenToAdd) {
      // https://eips.ethereum.org/EIPS/eip-747
      eip1193Provider.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            ...tokenToAdd,
          },
          // @web-onboard wrongly treats this as unknown[] but it should not
        } as unknown as unknown[],
      });
    }
  }, [eip1193Provider, tokenToAdd]);

  const amountFormatted = useMemo(
    () =>
      formatCurrency(amount, {
        currency: R_TOKEN,
        fractionDigits: USD_UI_PRECISION,
      }),
    [amount],
  );

  return (
    <ModalWrapper open={open} onClose={onClose}>
      <div className="raft__bridgeModal">
        <div className="raft__bridgeModal__status">
          <TokenLogo type={NETWORK_LOGO_VARIANTS[fromNetwork]} size={40} />
          <div className="raft__bridgeModal__icon">
            <Icon variant="checkmark" size={48} />
          </div>
          <TokenLogo type={NETWORK_LOGO_VARIANTS[toNetwork]} size={40} />
        </div>
        <div className="raft__bridgeModal__title">
          <Typography variant="heading1">Transaction successful</Typography>
        </div>
        <div className="raft__bridgeModal__subtitle">
          <Typography variant="heading2">
            {amountFormatted} bridged from {NETWORK_NAMES[fromNetwork]} to {NETWORK_NAMES[toNetwork]}
          </Typography>
        </div>
        <div className="raft__bridgeModal__description">
          <Typography variant="body">View transaction on&nbsp;</Typography>
          <Link href={`${config.ccipExplorerUrl}/msg/${messageId}`}>
            <Typography variant="body" color="text-accent" weight="medium">
              CCIP Explorer
            </Typography>
          </Link>
          <Typography variant="body">.</Typography>
        </div>
        <div className="raft__bridgeModal__actions">
          {tokenToAdd && (
            <div className="raft__bridgeModal__action">
              <Button variant="secondary" size="large" text={tokenToAdd.label} onClick={onAddTokenToWallet} />
            </div>
          )}
          <div className="raft__bridgeModal__action">
            <Button variant="primary" size="large" text="Continue" onClick={onClose} />
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default memo(BridgeSuccessModal);
