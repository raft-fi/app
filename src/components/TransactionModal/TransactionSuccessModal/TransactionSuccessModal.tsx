import { FC, ReactNode, useCallback, useState } from 'react';
import { ButtonWrapper, Link } from 'tempus-ui';
import { useBorrow, useEIP1193Provider } from '../../../hooks';
import { Button, Icon, ModalWrapper, Typography, ValuesBox } from '../../shared';

import './TransactionSuccessModal.scss';

interface TransactionSuccessModalProps {
  open: boolean;
  title: ReactNode | string;
  subtitle: string;
  infoHeader: string;
  infoEntries: { id: string; label: string; value: string }[];
  onClose: () => void;
}

const TransactionSuccessModal: FC<TransactionSuccessModalProps> = ({
  open,
  title,
  subtitle,
  infoHeader,
  infoEntries,
  onClose,
}) => {
  const { borrowStatus } = useBorrow();
  const eip1193Provider = useEIP1193Provider();
  const txHash = borrowStatus?.contractTransaction?.hash ?? '0x0';

  const [detailsOpen, setDetailsOpen] = useState<boolean>(true);

  const toggleDetails = useCallback(() => setDetailsOpen(prevState => !prevState), []);

  const onAddRToWallet = useCallback(() => {
    if (eip1193Provider) {
      // https://eips.ethereum.org/EIPS/eip-747
      eip1193Provider.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: '0x69665394a7ee38bb4599B0D7EBC9802242e2bF87',
            symbol: 'R',
            decimals: 18,
          },
          // @web-onboard wrongly treats this as unknown[] but it should not
        } as unknown as unknown[],
      });
    }
  }, [eip1193Provider]);

  return (
    <ModalWrapper open={open} onClose={onClose}>
      <div className="raft__transactionSuccessModal">
        <div className="raft__transactionSuccessModal__icon">
          <Icon variant="transaction-success" size={142} />
        </div>
        <div className="raft__transactionSuccessModal__title">
          {typeof title === 'string' ? (
            <Typography variant="subheader" weight="medium">
              {title}
            </Typography>
          ) : (
            title
          )}
        </div>
        <div className="raft__transactionSuccessModal__subtitle">
          <Typography variant="subtitle" weight="medium">
            {subtitle}
          </Typography>
        </div>
        <ButtonWrapper className="raft__transactionSuccessModal__infoHeader" onClick={toggleDetails}>
          <Typography variant="subtitle" weight="medium">
            {infoHeader}
          </Typography>
          <Icon variant={detailsOpen ? 'chevron-up' : 'chevron-down'} size={24} />
        </ButtonWrapper>
        {detailsOpen && (
          <div className="raft__transactionSuccessModal__info">
            <ValuesBox values={infoEntries} />
          </div>
        )}
        <div className="raft__transactionSuccessModal__explorerLink">
          <Typography variant="body-tertiary">View transaction history in&nbsp;</Typography>
          <Link href={`https://etherscan.io/tx/${txHash}`}>
            <Typography variant="body-tertiary" color="text-secondary">
              Etherscan
            </Typography>
          </Link>
          &nbsp;
          <Icon variant="external-link" size={10} />
        </div>
        <div className="raft__transactionSuccessModal__actions">
          <div className="raft__transactionSuccessModal__action">
            <Button variant="secondary" onClick={onAddRToWallet}>
              <Typography variant="body-primary" weight="medium">
                Add R to wallet
              </Typography>
            </Button>
          </div>
          <div className="raft__transactionSuccessModal__action">
            <Button variant="primary" onClick={onClose}>
              <Typography variant="body-primary" weight="bold" color="text-primary-inverted">
                Continue
              </Typography>
            </Button>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};
export default TransactionSuccessModal;
