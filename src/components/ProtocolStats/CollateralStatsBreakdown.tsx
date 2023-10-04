import { memo, useMemo } from 'react';
import { TokenLogo } from 'tempus-ui';
import {
  COLLATERAL_TOKEN_UI_PRECISION,
  SUPPORTED_COLLATERAL_TOKEN_SETTINGS,
  SUPPORTED_UNDERLYING_TOKENS,
  USD_UI_PRECISION,
} from '../../constants';
import { useCollateralConversionRates, useProtocolStats, useTokenPrices } from '../../hooks';
import { SupportedUnderlyingCollateralToken, TokenDecimalMap, TokenGenericMap } from '../../interfaces';
import { formatDecimal } from '../../utils';
import { Tooltip, Typography } from '../shared';

const CollateralStatsBreakdown = () => {
  const protocolStats = useProtocolStats();
  const tokenPriceMap = useTokenPrices();
  const collateralConversionRateMap = useCollateralConversionRates();

  const collateralSupplyMap = useMemo(
    () => protocolStats?.collateralSupply ?? ({} as TokenDecimalMap<SupportedUnderlyingCollateralToken>),
    [protocolStats?.collateralSupply],
  );
  const collateralSupplyAmountInDisplayTokenMap = useMemo(
    () =>
      SUPPORTED_UNDERLYING_TOKENS.reduce((map, underlyingToken) => {
        const displayToken = SUPPORTED_COLLATERAL_TOKEN_SETTINGS[underlyingToken].displayBaseToken;
        const rate = collateralConversionRateMap[displayToken];
        const supply = collateralSupplyMap[underlyingToken];

        if (!rate || !supply) {
          return map;
        }

        return {
          ...map,
          [underlyingToken]: supply.mul(rate),
        };
      }, {} as TokenGenericMap<SupportedUnderlyingCollateralToken, string>),
    [collateralConversionRateMap, collateralSupplyMap],
  );
  const collateralSupplyAmountInDisplayTokenFormattedMap = useMemo(
    () =>
      SUPPORTED_UNDERLYING_TOKENS.reduce(
        (map, underlyingToken) => ({
          ...map,
          [underlyingToken]: formatDecimal(
            collateralSupplyAmountInDisplayTokenMap[underlyingToken],
            COLLATERAL_TOKEN_UI_PRECISION,
          ),
        }),
        {} as TokenGenericMap<SupportedUnderlyingCollateralToken, string>,
      ),
    [collateralSupplyAmountInDisplayTokenMap],
  );
  const collateralSupplyValueFormattedMap = useMemo(
    () =>
      SUPPORTED_UNDERLYING_TOKENS.reduce((map, underlyingToken) => {
        const collateralSupply = collateralSupplyMap[underlyingToken];
        const tokenPrice = tokenPriceMap[underlyingToken];

        if (!collateralSupply || !tokenPrice) {
          return map;
        }

        return {
          ...map,
          [underlyingToken]: formatDecimal(collateralSupply.mul(tokenPrice), USD_UI_PRECISION),
        };
      }, {} as TokenGenericMap<SupportedUnderlyingCollateralToken, string>),
    [collateralSupplyMap, tokenPriceMap],
  );

  const psmTvlFormatted = useMemo(() => {
    if (!protocolStats) {
      return null;
    }

    return formatDecimal(protocolStats.psmTvlToken, USD_UI_PRECISION);
  }, [protocolStats]);

  const psmTvlValueFormatted = useMemo(() => {
    if (!protocolStats) {
      return null;
    }

    return formatDecimal(protocolStats.psmTvlFiat, USD_UI_PRECISION);
  }, [protocolStats]);

  return (
    <Tooltip className="raft__protocol-stats__collateral-breakdown">
      <ul>
        {SUPPORTED_UNDERLYING_TOKENS.map(underlyingToken => {
          // Hide WBTC from breakdown until we fully add support for it
          if (underlyingToken === 'WBTC') {
            return;
          }

          let tokenLabel: string = SUPPORTED_COLLATERAL_TOKEN_SETTINGS[underlyingToken].displayBaseToken;

          if (underlyingToken.endsWith('v1')) {
            tokenLabel = `${tokenLabel} (Old)`;
          }

          return (
            <li key={`breakdown-${underlyingToken}`}>
              <TokenLogo
                type={`token-${SUPPORTED_COLLATERAL_TOKEN_SETTINGS[underlyingToken].displayBaseToken}`}
                size="small"
              />
              <Typography className="raft__protocol-stats__collateral-breakdown__token-name" variant="body2">
                {tokenLabel}
              </Typography>
              <div className="raft__protocol-stats__collateral-breakdown__token-values">
                <div className="raft__protocol-stats__collateral-breakdown__token-amount">
                  <Typography variant="body" weight="medium">
                    {collateralSupplyAmountInDisplayTokenFormattedMap[underlyingToken] ?? '---'}&nbsp;
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
          );
        })}

        {/* Include PSM in breakdown as well */}
        <li key={`breakdown-psm-dai`}>
          <TokenLogo type="token-DAI" size="small" />
          <Typography className="raft__protocol-stats__collateral-breakdown__token-name" variant="body2">
            DAI
            <div className="raft__protocol-stats__collateral-breakdown__labelBadge">
              <Typography variant="caption" color="text-secondary" weight="semi-bold">
                PSM
              </Typography>
            </div>
          </Typography>

          <div className="raft__protocol-stats__collateral-breakdown__token-values">
            <div className="raft__protocol-stats__collateral-breakdown__token-amount">
              <Typography variant="body" weight="medium">
                {psmTvlFormatted ?? '---'}&nbsp;
              </Typography>
              <Typography variant="body2">DAI</Typography>
            </div>
            <div className="raft__protocol-stats__collateral-breakdown__token-value">
              <Typography variant="caption" color="text-secondary">
                $
              </Typography>
              <Typography variant="body2" weight="medium" color="text-secondary">
                {psmTvlValueFormatted ?? '---'}
              </Typography>
            </div>
          </div>
        </li>
      </ul>
    </Tooltip>
  );
};

export default memo(CollateralStatsBreakdown);
