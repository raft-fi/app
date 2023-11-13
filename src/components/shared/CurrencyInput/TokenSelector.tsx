import { MouseEvent, FC, useCallback, useState, useMemo } from 'react';
import { ButtonWrapper, TokenLogo } from '@tempusfinance/common-ui';
import Typography from '../Typography';
import Icon from '../Icon';
import Menu from '../Menu';

import './TokenSelector.scss';

type TokenSelectorProps = {
  tokens: string[];
  selectedToken: string;
  onTokenChange: (token: string) => void;
};

export const TokenSelector: FC<TokenSelectorProps> = ({ tokens, selectedToken, onTokenChange }) => {
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

  const isSingleToken = useMemo(() => tokens.length === 1, [tokens.length]);

  const onOpenDropdown = useCallback(() => {
    setDropdownOpen(true);
  }, []);

  const onCloseDropdown = useCallback(() => {
    setDropdownOpen(false);
  }, []);

  const handleTokenUpdate = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      onCloseDropdown();
      onTokenChange?.(String(event.currentTarget.getAttribute('data-token')));
    },
    [onCloseDropdown, onTokenChange],
  );

  return (
    <div
      className={`raft__currencyInput__tokenSelectorContainer ${
        isSingleToken ? 'raft__currencyInput__tokenSelectorContainer__single' : ''
      }`}
    >
      <ButtonWrapper
        className={`raft__currencyInput__tokenSelector ${
          isSingleToken ? 'raft__currencyInput__tokenSelector__single' : ''
        }`}
        onClick={onOpenDropdown}
      >
        <div className="raft__currencyInput__tokenLogoContainer">
          <TokenLogo type={`token-${selectedToken}`} size="small" />
        </div>
        {!isSingleToken && (
          <>
            <Typography className="raft__currencyInput__tokenLabel" variant="caption">
              {selectedToken}
            </Typography>
            <Icon variant={dropdownOpen ? 'chevron-up' : 'chevron-down'} size={16} />
          </>
        )}
      </ButtonWrapper>
      {!isSingleToken && (
        <Menu open={dropdownOpen} onClose={onCloseDropdown}>
          <div className="raft__currencyInput__dropdownContainer">
            {tokens.map(token => (
              <ButtonWrapper
                key={token}
                data-token={token}
                className="raft__currencyInput__dropdownItem"
                onClick={handleTokenUpdate}
              >
                <div className="raft__currencyInput__dropdownTokenLogoContainer">
                  <TokenLogo type={`token-${token}`} size="small" />
                </div>
                <Typography variant="caption">{token}</Typography>
              </ButtonWrapper>
            ))}
          </div>
        </Menu>
      )}
    </div>
  );
};
