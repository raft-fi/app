import { MouseEvent, FC, useCallback, useState, memo } from 'react';
import { ButtonWrapper, TokenLogo } from 'tempus-ui';
import { SupportedBridgeNetwork } from '../../interfaces';
import { Icon, Menu, Typography } from '../shared';

type NetworkSelectorProps = {
  networks: SupportedBridgeNetwork[];
  selectedNetwork: string;
  onNetworkChange: (network: SupportedBridgeNetwork) => void;
};

const NetworkSelector: FC<NetworkSelectorProps> = ({ networks, selectedNetwork, onNetworkChange }) => {
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

  const onOpenDropdown = useCallback(() => setDropdownOpen(true), []);
  const onCloseDropdown = useCallback(() => setDropdownOpen(false), []);

  const handleNetworkUpdate = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      onCloseDropdown();
      onNetworkChange(event.currentTarget.getAttribute('data-network') as SupportedBridgeNetwork);
    },
    [onCloseDropdown, onNetworkChange],
  );

  return (
    <div className="raft__bridge__network-selector-container">
      <ButtonWrapper className="raft__bridge__network-selector" onClick={onOpenDropdown}>
        {/* use network logo */}
        <TokenLogo type="token-ETH" size={20} />
        <Typography className="raft__bridge__token-label" variant="button-label">
          {selectedNetwork}
        </Typography>
        <Icon variant={dropdownOpen ? 'chevron-up' : 'chevron-down'} size={16} />
      </ButtonWrapper>
      <Menu open={dropdownOpen} onClose={onCloseDropdown}>
        <div className="raft__bridge__dropdown-container">
          {networks.map(network => (
            <ButtonWrapper
              key={network}
              data-network={network}
              className="raft__bridge__dropdown-item"
              onClick={handleNetworkUpdate}
            >
              {/* use network logo */}
              <TokenLogo type="token-ETH" size={20} />
              <Typography className="raft__bridge__dropdown-item-label" variant="caption">
                {network}
              </Typography>
            </ButtonWrapper>
          ))}
        </div>
      </Menu>
    </div>
  );
};

export default memo(NetworkSelector);
