import { FC, ReactNode, useCallback } from 'react';
import { Link } from 'tempus-ui';
import { useConfig, useEIP1193Provider } from '../../../hooks';
import { Nullable } from '../../../interfaces';
import { Button, Icon, ModalWrapper, Typography } from '../../shared';

import './TransactionSuccessModal.scss';

interface TransactionSuccessModalProps {
  open: boolean;
  title: ReactNode | string;
  subtitle: string;
  txHash?: string;
  blockExplorerLabel: string;
  blockExplorerUrl?: string;
  tokenToAdd: Nullable<{
    label: string;
    address: string;
    symbol: string;
    decimals: number;
    image: string;
  }>;
  onClose: () => void;
}

const TransactionSuccessModal: FC<TransactionSuccessModalProps> = ({
  open,
  title,
  subtitle,
  tokenToAdd,
  txHash = '',
  blockExplorerLabel,
  blockExplorerUrl,
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

  return (
    <ModalWrapper open={open} onClose={onClose}>
      <div className="raft__transactionSuccessModal">
        <div className="raft__transactionSuccessModal__icon">
          <Icon variant="transaction-success" size={142} />
        </div>
        <div className="raft__transactionSuccessModal__title">
          {typeof title === 'string' ? <Typography variant="heading1">{title}</Typography> : title}
        </div>
        <div className="raft__transactionSuccessModal__subtitle">
          <Typography variant="heading2" color="text-secondary">
            {subtitle}
          </Typography>
        </div>
        <div className="raft__transactionSuccessModal__explorerLink">
          <Typography variant="body">View transaction on&nbsp;</Typography>
          <Link href={blockExplorerUrl ? blockExplorerUrl : `${config.blockExplorerUrl}/tx/${txHash}`}>
            <Typography variant="body" color="text-accent" weight="medium">
              {blockExplorerLabel}
            </Typography>
          </Link>
          <Typography variant="body">.</Typography>
        </div>
        <div className="raft__transactionSuccessModal__actions">
          {tokenToAdd && (
            <div className="raft__transactionSuccessModal__action">
              <Button variant="secondary" size="large" text={tokenToAdd.label} onClick={onAddTokenToWallet} />
            </div>
          )}
          <div className="raft__transactionSuccessModal__action">
            <Button variant="primary" size="large" text="Continue" onClick={onClose} />
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};
export default TransactionSuccessModal;
