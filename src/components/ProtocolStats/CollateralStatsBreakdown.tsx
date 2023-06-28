import { memo, useMemo } from 'react';
import { TokenLogo } from 'tempus-ui';
import {
  COLLATERAL_TOKEN_UI_PRECISION,
  SUPPORTED_COLLATERAL_TOKEN_SETTINGS,
  SUPPORTED_UNDERLYING_TOKENS,
  USD_UI_PRECISION,
} from '../../constants';
import { useProtocolStats, useTokenPrices } from '../../hooks';
import { SupportedUnderlyingCollateralToken, TokenDecimalMap, TokenGenericMap } from '../../interfaces';
import { formatDecimal } from '../../utils';
import { Tooltip, Typography } from '../shared';

const CollateralStatsBreakdown = () => {
  const protocolStats = useProtocolStats();
  const tokenPriceMap = useTokenPrices();

  const collateralSupplyMap = useMemo(
    () => protocolStats?.collateralSupply ?? ({} as TokenDecimalMap<SupportedUnderlyingCollateralToken>),
    [protocolStats?.collateralSupply],
  );
  const collateralSupplyAmountFormattedMap = SUPPORTED_UNDERLYING_TOKENS.reduce(
    (map, underlyingToken) => ({
      ...map,
      [underlyingToken]: formatDecimal(collateralSupplyMap[underlyingToken], COLLATERAL_TOKEN_UI_PRECISION),
    }),
    {} as TokenGenericMap<SupportedUnderlyingCollateralToken, string>,
  );
  const collateralSupplyValueFormattedMap = SUPPORTED_UNDERLYING_TOKENS.reduce((map, underlyingToken) => {
    const collateralSupply = collateralSupplyMap[underlyingToken];
    const tokenPrice = tokenPriceMap[underlyingToken];

    if (!collateralSupply || !tokenPrice) {
      return map;
    }

    return {
      ...map,
      [underlyingToken]: formatDecimal(collateralSupply.mul(tokenPrice), USD_UI_PRECISION),
    };
  }, {} as TokenGenericMap<SupportedUnderlyingCollateralToken, string>);

  return (
    <Tooltip className="raft__protocol-stats__collateral-breakdown">
      <ul>
        {SUPPORTED_UNDERLYING_TOKENS.map(underlyingToken => (
          <li key={`breakdown-${underlyingToken}`}>
            <TokenLogo
              type={`token-${SUPPORTED_COLLATERAL_TOKEN_SETTINGS[underlyingToken].displayBaseToken}`}
              size="small"
            />
            <Typography className="raft__protocol-stats__collateral-breakdown__token-name" variant="body2">
              {SUPPORTED_COLLATERAL_TOKEN_SETTINGS[underlyingToken].displayBaseToken}
            </Typography>
            <div className="raft__protocol-stats__collateral-breakdown__token-values">
              <div className="raft__protocol-stats__collateral-breakdown__token-amount">
                <Typography variant="body" weight="medium">
                  {collateralSupplyAmountFormattedMap[underlyingToken] ?? '---'}&nbsp;
                </Typography>
                <Typography variant="body2">
                  {SUPPORTED_COLLATERAL_TOKEN_SETTINGS[underlyingToken].displayBaseToken}
                </Typography>
              </div>
              <div className="raft__protocol-stats__collateral-breakdown__token-value">
                <Typography variant="caption" color="text-secondary">
                  $
                </Typography>
                <Typography variant="body2" weight="medium" color="text-secondary">
                  {collateralSupplyValueFormattedMap[underlyingToken] ?? '---'}
                </Typography>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Tooltip>
  );
};

export default memo(CollateralStatsBreakdown);
