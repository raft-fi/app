import { RaftConfig, Token } from '@raft-fi/sdk';
import { memo, useCallback } from 'react';
import { ButtonWrapper, Link, TokenLogo } from 'tempus-ui';
import { SUPPORTED_COLLATERAL_TOKENS, TOKEN_LOGO_MAP } from '../../constants';
import { useConfig } from '../../hooks';
import { shortenAddress } from '../../utils';
import { Icon, Tooltip, Typography } from '../shared';

const R_TOKEN_IMAGE = 'https://raft.fi/rtoken.png';

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
        {SUPPORTED_COLLATERAL_TOKENS.map(item => {
          const token = item as Token;
          const address = RaftConfig.getTokenAddress(token) ?? '';
          const blockExplorerUrl = `${config.blockExplorerUrl}/address/${address}`;

          return (
            <li key={`token-item-${token}`}>
              {<TokenLogo type={`token-${TOKEN_LOGO_MAP[token]}`} size={16} /> || (
                <div className="raft__position-after__tokenAddressTooltip__token-placeholder" />
              )}
              <Typography className="raft__position-after__tokenAddressTooltip__token" variant="body2">
                {token}
              </Typography>
              {address && (
                <>
                  <Typography
                    className="raft__position-after__tokenAddressTooltip__address"
                    variant="body2"
                    weight="medium"
                    color="text-secondary"
                  >
                    {shortenAddress(address)}
                  </Typography>
                  <Link className="raft__position-after__tokenAddressTooltip__link" href={blockExplorerUrl}>
                    <Icon variant="external-link" size="small" />
                  </Link>
                  <ButtonWrapper title="Add token to Metamask" onClick={() => addTokenToMetamask(token)}>
                    <Icon variant="metamask" size="small" />
                  </ButtonWrapper>
                </>
              )}
            </li>
          );
        })}
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
          <ButtonWrapper title="Add token to Metamask" onClick={() => addTokenToMetamask('R', R_TOKEN_IMAGE)}>
            <Icon variant="metamask" size="small" />
          </ButtonWrapper>
        </li>
      </ul>
    </Tooltip>
  );
};

export default memo(TokenAddressTooltip);
