import { FC, ReactNode, useCallback } from 'react';
import { Link } from 'tempus-ui';
import { ZERO_ADDRESS } from '../../../constants';
import { useBorrow, useConfig, useEIP1193Provider } from '../../../hooks';
import { Button, Icon, ModalWrapper, Typography, ValuesBox } from '../../shared';

import './TransactionSuccessModal.scss';

interface TransactionSuccessModalProps {
  open: boolean;
  title: ReactNode | string;
  subtitle: string;
  infoHeader: string;
  infoEntries: { id: string; label: string; value: ReactNode | string }[];
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
  const config = useConfig();
  const txHash = borrowStatus?.contractTransaction?.hash ?? ZERO_ADDRESS;

  const onAddRToWallet = useCallback(() => {
    if (eip1193Provider) {
      // https://eips.ethereum.org/EIPS/eip-747
      eip1193Provider.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: config.rToken,
            symbol: 'R',
            decimals: 18,
            image: 'https://raft.fi/rtoken.png',
          },
          // @web-onboard wrongly treats this as unknown[] but it should not
        } as unknown as unknown[],
      });
    }
  }, [config.rToken, eip1193Provider]);

  return (
    <ModalWrapper open={open} onClose={onClose}>
      <div className="raft__transactionSuccessModal">
        <div className="raft__transactionSuccessModal__icon">
          <Icon variant="transaction-success" size={142} />
        </div>
        <div className="raft__transactionSuccessModal__title">
          {typeof title === 'string' ? <Typography variant="heading3">{title}</Typography> : title}
        </div>
        <div className="raft__transactionSuccessModal__subtitle">
          <Typography variant="heading2">{subtitle}</Typography>
        </div>
        <div className="raft__transactionSuccessModal__info">
          <Typography className="raft__transactionSuccessModal__info__title" variant="body">
            {infoHeader}
          </Typography>
          <ValuesBox values={infoEntries} />
        </div>
        <div className="raft__transactionSuccessModal__explorerLink">
          <Typography variant="caption">View transaction on&nbsp;</Typography>
          <Link href={`${config.blockExplorerUrl}/tx/${txHash}`}>
            <Typography variant="caption" color="text-accent">
              Etherscan
            </Typography>
          </Link>
          &nbsp;
          <Icon variant="external-link" size={10} />
        </div>
        <div className="raft__transactionSuccessModal__actions">
          <div className="raft__transactionSuccessModal__action">
            <Button variant="secondary" text="Add R to wallet" onClick={onAddRToWallet} />
          </div>
          <div className="raft__transactionSuccessModal__action">
            <Button variant="primary" text="Continue" onClick={onClose} />
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};
export default TransactionSuccessModal;
