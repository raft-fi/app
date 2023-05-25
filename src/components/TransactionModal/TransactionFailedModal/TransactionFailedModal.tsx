import { FC, memo } from 'react';
import { Button, Icon, ModalWrapper, Typography } from '../../shared';

import './TransactionFailedModal.scss';

interface TransactionFailedModalProps {
  open: boolean;
  error: string;
  onClose: () => void;
  onTryAgain: () => void;
}

const TransactionFailedModal: FC<TransactionFailedModalProps> = ({ open, error, onClose, onTryAgain }) => (
  <ModalWrapper open={open} onClose={onClose}>
    <div className="raft__transactionFailedModal">
      <div className="raft__transactionFailedModal__icon">
        <Icon variant="transaction-failed" size={142} />
      </div>
      <div className="raft__transactionFailedModal__title">
        <Typography variant="heading1">Transaction failed</Typography>
      </div>
      <div className="raft__transactionFailedModal__errorMessage">
        <div className="raft__transactionFailedModal__errorMessage__title">
          <Typography variant="body">Transaction summary</Typography>
        </div>
        <div className="raft__transactionFailedModal__errorMessage__content">
          <Typography variant="body">{error}</Typography>
        </div>
      </div>
      <div className="raft__transactionFailedModal__actions">
        <div className="raft__transactionFailedModal__action">
          <Button variant="secondary" text="Close" onClick={onClose} />
        </div>
        <div className="raft__transactionFailedModal__action">
          <Button variant="primary" text="Try again" onClick={onTryAgain} />
        </div>
      </div>
    </div>
  </ModalWrapper>
);

export default memo(TransactionFailedModal);
