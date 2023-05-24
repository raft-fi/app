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
          <Icon variant="unsupported-network" size={142} />
        </div>
        <div className="raft__networkErrorModal__title">
          <Typography variant="heading1">Unsupported network.</Typography>
        </div>
        <div className="raft__networkErrorModal__subtitle">
          <Typography variant="heading2">{`Your wallet is not on ${config.networkName}.`}</Typography>
        </div>
        <div className="raft__networkErrorModal__actions">
          <div className="raft__networkErrorModal__action">
            <Button variant="secondary" text="Disconnect" onClick={onDisconnect} />
          </div>
          <div className="raft__networkErrorModal__action">
            <Button variant="primary" text="Switch network" onClick={switchToSupportedNetwork} />
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default memo(NetworkErrorModal);
