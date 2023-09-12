import { SupportedBridgeNetwork } from '@raft-fi/sdk';
import { FC, memo } from 'react';
import { Link, TokenLogo } from 'tempus-ui';
import { CCIP_EXPLORER_URL } from '../../../constants';
import { NETWORK_LOGO_VARIANTS } from '../../../networks';
import { Button, Icon, ModalWrapper, Typography } from '../../shared';

import './BridgeModal.scss';

interface BridgeFailedModalProps {
  open: boolean;
  error: string;
  fromNetwork: SupportedBridgeNetwork;
  toNetwork: SupportedBridgeNetwork;
  messageId?: string;
  onClose: () => void;
  onTryAgain: () => void;
}

const BridgeFailedModal: FC<BridgeFailedModalProps> = ({
  open,
  error,
  fromNetwork,
  toNetwork,
  messageId,
  onClose,
  onTryAgain,
}) => (
  <ModalWrapper open={open} onClose={onClose}>
    <div className="raft__bridgeModal">
      <div className="raft__bridgeModal__status">
        <TokenLogo type={NETWORK_LOGO_VARIANTS[fromNetwork]} size={40} />
        <div className="raft__bridgeModal__icon">
          <Icon variant="error-inverted" size={48} />
        </div>
        <TokenLogo type={NETWORK_LOGO_VARIANTS[toNetwork]} size={40} />
      </div>
      <div className="raft__bridgeModal__title">
        <Typography variant="heading1">Transaction failed</Typography>
      </div>
      <div className="raft__bridgeModal__description">
        <Typography variant="body">View transaction on&nbsp;</Typography>
        <Link href={`${CCIP_EXPLORER_URL}/msg/${messageId}`}>
          <Typography variant="body" color="text-accent" weight="medium">
            CCIP Explorer
          </Typography>
        </Link>
        <Typography variant="body">.</Typography>
      </div>
      <div className="raft__bridgeModal__errorMessage">
        <div className="raft__bridgeModal__errorMessage__title">
          <Typography variant="body" weight="medium">
            Transaction summary
          </Typography>
        </div>
        <div className="raft__bridgeModal__errorMessage__content">
          <Typography variant="body" color="text-secondary">
            {error}
          </Typography>
        </div>
      </div>
      <div className="raft__bridgeModal__actions">
        <div className="raft__bridgeModal__action">
          <Button variant="secondary" size="large" text="Close" onClick={onClose} />
        </div>
        <div className="raft__bridgeModal__action">
          <Button variant="primary" size="large" text="Try again" onClick={onTryAgain} />
        </div>
      </div>
    </div>
  </ModalWrapper>
);

export default memo(BridgeFailedModal);
