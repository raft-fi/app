import { useConnectWallet } from '@web3-onboard/react';
import { FC, memo, useCallback, useEffect, useState } from 'react';
import { ButtonWrapper } from 'tempus-ui';
import { useConfig, useNetwork } from '../../hooks';
import { Button, Icon, ModalWrapper, Typography } from '../shared';

import './NetworkErrorModal.scss';

const NetworkErrorModal: FC = () => {
  const config = useConfig();
  const { isWrongNetwork, switchToSupportedNetwork } = useNetwork();
  const [{ wallet }, , disconnect] = useConnectWallet();

  const [open, setOpen] = useState<boolean>(false);

  useEffect(() => {
    setOpen(isWrongNetwork);
  }, [isWrongNetwork]);

  const onClose = useCallback(() => setOpen(false), []);
  const onDisconnect = useCallback(() => {
    if (wallet) {
      disconnect(wallet);
    }
  }, [disconnect, wallet]);

  return (
    <ModalWrapper open={open} onClose={onClose}>
      <div className="raft__networkErrorModal">
        <div className="raft__networkErrorModal__header">
          <ButtonWrapper className="raft__networkErrorModal__header__close" onClick={onClose}>
            <Icon variant="close" size="tiny" />
          </ButtonWrapper>
        </div>
        <div className="raft__networkErrorModal__icon">
          <Icon variant="transaction-failed" size={142} />
        </div>
        <div className="raft__networkErrorModal__title">
          <Typography variant="subheader" weight="medium">
            Wrong network.
          </Typography>
        </div>
        <div className="raft__networkErrorModal__subtitle">
          <Typography variant="subtitle" weight="medium">
            {`Your wallet is not on ${config.networkName}.`}
          </Typography>
        </div>
        <div className="raft__networkErrorModal__actions">
          <div className="raft__networkErrorModal__action">
            <Button variant="secondary" onClick={onDisconnect}>
              <Typography variant="body-primary" weight="medium">
                Disconnect
              </Typography>
            </Button>
          </div>
          <div className="raft__networkErrorModal__action">
            <Button variant="primary" onClick={switchToSupportedNetwork}>
              <Typography variant="body-primary" weight="bold" color="text-primary-inverted">
                Switch network
              </Typography>
            </Button>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default memo(NetworkErrorModal);
