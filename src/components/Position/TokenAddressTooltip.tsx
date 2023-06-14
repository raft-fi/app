import { RaftConfig, Token } from '@raft-fi/sdk';
import { memo, useCallback } from 'react';
import { ButtonWrapper, Link, TokenLogo } from 'tempus-ui';
import { SUPPORTED_COLLATERAL_TOKENS } from '../../constants';
import { useConfig } from '../../hooks';
import { shortenAddress } from '../../utils';
import { Icon, Tooltip, Typography } from '../shared';

const TokenAddressTooltip = () => {
  const config = useConfig();

  const addTokenToMetamask = useCallback((symbol: Token, image?: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ethereum = (window as any).ethereum;

    if (ethereum) {
      const address = RaftConfig.getTokenAddress(symbol);

      if (address) {
        ethereum.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address: RaftConfig.getTokenAddress(symbol),
              symbol,
              decimals: 18,
              image,
            },
          },
        });
      }
    }
  }, []);

  return (
    <Tooltip className="raft__position-after__tokenAddressTooltip">
      <ul>
        {SUPPORTED_COLLATERAL_TOKENS.map(token => (
          <li key={`token-item-${token}`}>
            <TokenLogo type={`token-${token}`} size={16} />
            <Typography className="raft__position-after__tokenAddressTooltip__token" variant="body2">
              {token}
            </Typography>
            <Typography
              className="raft__position-after__tokenAddressTooltip__address"
              variant="body2"
              weight="medium"
              color="text-secondary"
            >
              {shortenAddress(RaftConfig.getTokenAddress(token as Token) ?? '')}
            </Typography>
            <Link
              className="raft__position-after__tokenAddressTooltip__link"
              href={`${config.blockExplorerUrl}/address/${RaftConfig.getTokenAddress(token as Token)}`}
            >
              <Icon variant="external-link" size="small" />
            </Link>
            <ButtonWrapper title="Add token to Metamask" onClick={() => addTokenToMetamask(token as Token)}>
              <Icon variant="metamask" size="small" />
            </ButtonWrapper>
          </li>
        ))}
        <li>
          <TokenLogo type="token-R" size={16} />
          <Typography className="raft__position-after__tokenAddressTooltip__token" variant="body2">
            R
          </Typography>
          <Typography
            className="raft__position-after__tokenAddressTooltip__address"
            variant="body2"
            weight="medium"
            color="text-secondary"
          >
            {shortenAddress(RaftConfig.getTokenAddress('R'))}
          </Typography>
          <Link
            className="raft__position-after__tokenAddressTooltip__link"
            href={`${config.blockExplorerUrl}/address/${RaftConfig.getTokenAddress('R')}`}
          >
            <Icon variant="external-link" size="small" />
          </Link>
          <ButtonWrapper
            title="Add token to Metamask"
            onClick={() => addTokenToMetamask('R', 'https://raft.fi/rtoken.png')}
          >
            <Icon variant="metamask" size="small" />
          </ButtonWrapper>
        </li>
      </ul>
    </Tooltip>
  );
};

export default memo(TokenAddressTooltip);
