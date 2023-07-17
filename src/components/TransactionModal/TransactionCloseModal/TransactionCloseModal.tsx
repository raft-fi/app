import { FC, ReactNode } from 'react';
import { Link } from 'tempus-ui';
import { ZERO_ADDRESS } from '../../../constants';
import { useConfig } from '../../../hooks';
import { Button, Icon, ModalWrapper, Typography } from '../../shared';

import './TransactionCloseModal.scss';

interface TransactionCloseModalProps {
  open: boolean;
  title: ReactNode | string;
  txHash?: string;
  onClose: () => void;
}

const TransactionCloseModal: FC<TransactionCloseModalProps> = ({ open, title, txHash = ZERO_ADDRESS, onClose }) => {
  const config = useConfig();

  return (
    <ModalWrapper open={open} onClose={onClose}>
      <div className="raft__transactionCloseModal">
        <div className="raft__transactionCloseModal__icon">
          <Icon variant="transaction-success" size={142} />
        </div>
        <div className="raft__transactionCloseModal__title">
          {typeof title === 'string' ? <Typography variant="heading3">{title}</Typography> : title}
        </div>
        <div className="raft__transactionSuccessModal__subtitle">
          <Typography variant="heading2">You've successfully closed your Position</Typography>
        </div>
        <div className="raft__transactionCloseModal__explorerLink">
          <Typography variant="caption">View transaction on&nbsp;</Typography>
          <Link href={`${config.blockExplorerUrl}/tx/${txHash}`}>
            <Typography variant="caption" color="text-accent">
              Etherscan
            </Typography>
          </Link>
        </div>
        <div className="raft__transactionCloseModal__actions">
          <div className="raft__transactionCloseModal__action">
            <Button variant="primary" size="large" text="Continue" onClick={onClose} />
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};
export default TransactionCloseModal;
