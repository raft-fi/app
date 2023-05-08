import { FC, useCallback, useState } from 'react';
import { ButtonWrapper } from 'tempus-ui';
import { Button, Icon, ModalWrapper, Typography } from '../../shared';

import './TransactionFailedModal.scss';

interface TransactionFailedModalProps {
  open: boolean;
  error: string;
  onClose: () => void;
  onTryAgain: () => void;
}

const TransactionFailedModal: FC<TransactionFailedModalProps> = ({ open, error, onClose, onTryAgain }) => {
  const [detailsOpen, setDetailsOpen] = useState<boolean>(true);

  const toggleDetails = useCallback(() => {
    setDetailsOpen(prevState => !prevState);
  }, []);

  return (
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
        <ButtonWrapper
          className={`raft__transactionFailedModal__errorHeader ${
            detailsOpen ? '' : 'raft__transactionFailedModal__errorHeaderDetailsOpen'
          }`}
          onClick={toggleDetails}
        >
          <Typography variant="subtitle" weight="medium">
            Transaction details
          </Typography>
          <Icon variant={detailsOpen ? 'chevron-up' : 'chevron-down'} size={24} />
        </ButtonWrapper>
        {detailsOpen && (
          <div className="raft__transactionFailedModal__errorMessage">
            <Typography variant="body-primary">{error}</Typography>
          </div>
        )}
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
};
export default TransactionFailedModal;
