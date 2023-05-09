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
        <Typography variant="subheader" weight="medium">
          Transaction failed
        </Typography>
      </div>
      <div className="raft__transactionFailedModal__errorMessage">
        <div className="raft__transactionFailedModal__errorMessage__title">
          <Typography variant="body-primary" weight="semi-bold">
            Transaction summary
          </Typography>
        </div>
        <div className="raft__transactionFailedModal__errorMessage__content">
          <Typography variant="body-primary">{error}</Typography>
        </div>
      </div>
      <div className="raft__transactionFailedModal__actions">
        <div className="raft__transactionFailedModal__action">
          <Button variant="secondary" onClick={onClose}>
            <Typography variant="body-primary" weight="medium">
              Close
            </Typography>
          </Button>
        </div>
        <div className="raft__transactionFailedModal__action">
          <Button variant="primary" onClick={onTryAgain}>
            <Typography variant="body-primary" weight="bold" color="text-primary-inverted">
              Try again
            </Typography>
          </Button>
        </div>
      </div>
    </div>
  </ModalWrapper>
);

export default memo(TransactionFailedModal);
