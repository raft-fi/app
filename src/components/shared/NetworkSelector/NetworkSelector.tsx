import { MouseEvent, FC, useCallback, useState, memo } from 'react';
import { SupportedBridgeNetwork, SupportedSavingsNetwork } from '@raft-fi/sdk';
import { ButtonWrapper, TokenLogo } from 'tempus-ui';
import { NETWORK_LOGO_VARIANTS, NETWORK_NAMES } from '../../../networks';
import { Icon, Menu, Typography } from '../';

import './NetworkSelector.scss';

type NetworkSelectorMenuAlignment = 'left' | 'right';

type NetworkSelectorProps = {
  networks: (SupportedBridgeNetwork | SupportedSavingsNetwork)[];
  selectedNetwork: string;
  align?: NetworkSelectorMenuAlignment;
  onNetworkChange: (network: string) => void;
};

const NetworkSelector: FC<NetworkSelectorProps> = ({ networks, selectedNetwork, align = 'left', onNetworkChange }) => {
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

  const onOpenDropdown = useCallback(() => setDropdownOpen(true), []);
  const onCloseDropdown = useCallback(() => setDropdownOpen(false), []);

  const handleNetworkUpdate = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      onCloseDropdown();
      onNetworkChange(event.currentTarget.getAttribute('data-network') as string);
    },
    [onCloseDropdown, onNetworkChange],
  );

  return (
    <div className={`raft__networkSelector raft__networkSelector__align-${align}`}>
      <ButtonWrapper className="raft__networkSelector__dropdown" onClick={onOpenDropdown}>
        <TokenLogo type={NETWORK_LOGO_VARIANTS[selectedNetwork]} size={20} />
        <Typography className="raft__networkSelector__dropdownLabel" variant="button-label">
          {NETWORK_NAMES[selectedNetwork]}
        </Typography>
        <Icon variant={dropdownOpen ? 'chevron-up' : 'chevron-down'} size={16} />
      </ButtonWrapper>
      <Menu open={dropdownOpen} onClose={onCloseDropdown}>
        <div className="raft__networkSelector__dropdownContainer">
          {networks.map(network => (
            <ButtonWrapper
              key={network}
              data-network={network}
              className={`raft__networkSelector__dropdownItem ${
                network === selectedNetwork ? 'raft__networkSelector__dropdownItemSelected' : ''
              }`}
              onClick={handleNetworkUpdate}
            >
              <TokenLogo type={NETWORK_LOGO_VARIANTS[network]} size={20} />
              <Typography className="raft__networkSelector__dropdownItemLabel" variant="caption">
                {NETWORK_NAMES[network]}
              </Typography>
            </ButtonWrapper>
          ))}
        </div>
      </Menu>
    </div>
  );
};

export default memo(NetworkSelector);
