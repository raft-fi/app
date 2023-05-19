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
        <div className="raft__transactionSuccessModal__info">
          <Typography className="raft__transactionSuccessModal__info__title" variant="body-primary" weight="semi-bold">
            {infoHeader}
          </Typography>
          <ValuesBox values={infoEntries} />
        </div>
        <div className="raft__transactionSuccessModal__explorerLink">
          <Typography variant="body-tertiary">View transaction on&nbsp;</Typography>
          <Link href={`${config.blockExplorerUrl}/tx/${txHash}`}>
            <Typography variant="body-tertiary" color="text-accent">
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
                Add&nbsp;
              </Typography>
              <Typography variant="body-primary" weight="medium" type="mono">
                R
              </Typography>
              <Typography variant="body-primary" weight="medium">
                &nbsp;to wallet
              </Typography>
            </Button>
          </div>
          <div className="raft__transactionSuccessModal__action">
            <Button variant="primary" onClick={onClose}>
              <Typography variant="body-primary" weight="medium" color="text-primary-inverted">
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
