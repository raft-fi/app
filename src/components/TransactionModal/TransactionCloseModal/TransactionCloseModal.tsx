import { FC, ReactNode } from 'react';
import { Link } from 'tempus-ui';
import { ZERO_ADDRESS } from '../../../constants';
import { useBorrow, useConfig } from '../../../hooks';
import { Button, Icon, ModalWrapper, Typography } from '../../shared';

import './TransactionCloseModal.scss';

interface TransactionCloseModalProps {
  open: boolean;
  title: ReactNode | string;
  onClose: () => void;
}

const TransactionCloseModal: FC<TransactionCloseModalProps> = ({ open, title, onClose }) => {
  const { borrowStatus } = useBorrow();
  const config = useConfig();
  const txHash = borrowStatus?.contractTransaction?.hash ?? ZERO_ADDRESS;

  return (
    <ModalWrapper open={open} onClose={onClose}>
      <div className="raft__transactionCloseModal">
        <div className="raft__transactionCloseModal__icon">
          <Icon variant="transaction-success" size={142} />
        </div>
        <div className="raft__transactionCloseModal__title">
          {typeof title === 'string' ? <Typography variant="heading1">{title}</Typography> : title}
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
          &nbsp;
          <Icon variant="external-link" size={10} />
        </div>
        <div className="raft__transactionCloseModal__actions">
          <div className="raft__transactionCloseModal__action">
            <Button variant="primary" text="Continue" onClick={onClose} />
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};
export default TransactionCloseModal;
