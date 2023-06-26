import { Decimal } from '@tempusfinance/decimal';
import { memo, useMemo } from 'react';
import { TokenLogo } from 'tempus-ui';
import { R_TOKEN } from '@raft-fi/sdk';
import { useProtocolStats, useTokenPrices } from '../../hooks';
import {
  formatDecimal,
  formatMultiplier,
  getProtocolCollateralRatioLabel,
  getProtocolCollateralRatioLevel,
  getTokenValues,
} from '../../utils';
import { SUPPORTED_COLLATERAL_TOKEN_SETTINGS, SUPPORTED_UNDERLYING_TOKENS, USD_UI_PRECISION } from '../../constants';
import { TooltipWrapper, Typography } from '../shared';
import { SupportedUnderlyingCollateralToken, TokenDecimalMap } from '../../interfaces';

import './ProtocolStats.scss';
import CollateralStatsBreakdown from './CollateralStatsBreakdown';

const ProtocolStats = () => {
  const protocolStats = useProtocolStats();
  const tokenPriceMap = useTokenPrices();

  const collateralSupplyMap = useMemo(
    () => protocolStats?.collateralSupply ?? ({} as TokenDecimalMap<SupportedUnderlyingCollateralToken>),
    [protocolStats?.collateralSupply],
  );
  const debtSupplyMap = useMemo(
    () => protocolStats?.debtSupply ?? ({} as TokenDecimalMap<SupportedUnderlyingCollateralToken>),
    [protocolStats?.debtSupply],
  );

  const totalCollateralValue = useMemo(
    () =>
      SUPPORTED_UNDERLYING_TOKENS.reduce((sum, underlyingCollateralToken) => {
        const supply = collateralSupplyMap[underlyingCollateralToken];
        const tokenValues = getTokenValues(supply, tokenPriceMap[underlyingCollateralToken], underlyingCollateralToken);
        return sum.add(tokenValues.value ?? Decimal.ZERO);
      }, Decimal.ZERO),
    [collateralSupplyMap, tokenPriceMap],
  );
  const totalDebtTokenValues = useMemo(() => {
    const debtAmount = SUPPORTED_UNDERLYING_TOKENS.reduce((sum, underlyingCollateralToken) => {
      const supply = debtSupplyMap[underlyingCollateralToken];
      return sum.add(supply ?? Decimal.ZERO);
    }, Decimal.ZERO);

    return getTokenValues(debtAmount, tokenPriceMap.R, R_TOKEN);
  }, [debtSupplyMap, tokenPriceMap.R]);

  const totalCollateralValueMultiplierFormatted = useMemo(
    () => formatMultiplier(totalCollateralValue),
    [totalCollateralValue],
  );
  const totalCollateralValueDecimalFormatted = useMemo(
    () => formatDecimal(totalCollateralValue, USD_UI_PRECISION),
    [totalCollateralValue],
  );
  const totalDebtAmountFormatted = useMemo(
    () => formatDecimal(totalDebtTokenValues.amount, 0),
    [totalDebtTokenValues.amount],
  );
  const totalDebtValueDecimalFormatted = useMemo(
    () => formatDecimal(totalDebtTokenValues.value, USD_UI_PRECISION),
    [totalDebtTokenValues.value],
  );

  const collateralizationRatio = useMemo(() => {
    if (!totalDebtTokenValues.value || totalDebtTokenValues.value.isZero()) {
      return null;
    }

    return totalCollateralValue.div(totalDebtTokenValues.value);
  }, [totalDebtTokenValues.value, totalCollateralValue]);

  const collateralizationRatioFormatted = useMemo(
    () => formatDecimal(collateralizationRatio?.mul(100) ?? null, 2),
    [collateralizationRatio],
  );
  const collateralRatioLevel = useMemo(
    () => getProtocolCollateralRatioLevel(collateralizationRatio),
    [collateralizationRatio],
  );
  const collateralRatioLabel = useMemo(
    () => getProtocolCollateralRatioLabel(collateralizationRatio),
    [collateralizationRatio],
  );

  return (
    <div className="raft__protocol-stats">
      <TooltipWrapper tooltipContent={<CollateralStatsBreakdown />} placement="bottom">
        <div className="raft__protocol-stats__collateral">
          <Typography variant="overline" color="text-accent">
            PROTOCOL SUPPLY
          </Typography>
          <div className="raft__protocol-stats__collateral__amount">
            <div className="raft__protocol-stats__collateral__tokens">
              {SUPPORTED_UNDERLYING_TOKENS.map((underlyingToken, i) => (
                <div
                  key={`token=${underlyingToken}`}
                  className="raft__protocol-stats__collateral__token-container"
                  style={{ zIndex: SUPPORTED_UNDERLYING_TOKENS.length - i }}
                >
                  <TokenLogo
                    type={`token-${SUPPORTED_COLLATERAL_TOKEN_SETTINGS[underlyingToken].displayBaseToken}`}
                    size="small"
                  />
                </div>
              ))}
            </div>
            <div className="raft__protocol-stats__collateral__amount__number">
              <Typography variant="heading2">$</Typography>
              <Typography variant="heading1">{totalCollateralValueMultiplierFormatted}</Typography>
            </div>
          </div>
          <div className="raft__protocol-stats__collateral__value__number">
            <Typography variant="caption" color="text-secondary">
              $
            </Typography>
            <Typography variant="body" weight="medium" color="text-secondary">
              {totalCollateralValueDecimalFormatted}
            </Typography>
          </div>
        </div>
      </TooltipWrapper>
      <div className="raft__protocol-stats__debt">
        <Typography variant="overline" color="text-accent">
          TOTAL GENERATED
        </Typography>
        <div className="raft__protocol-stats__debt__amount">
          <TokenLogo type={`token-${R_TOKEN}`} size="small" />
          <div className="raft__protocol-stats__debt__amount__number">
            <Typography variant="heading1">{totalDebtAmountFormatted ?? '---'}</Typography>
            <Typography variant="heading2">{R_TOKEN}</Typography>
          </div>
        </div>
        <div className="raft__protocol-stats__debt__value__number">
          <Typography variant="caption" color="text-secondary">
            $
          </Typography>
          <Typography variant="body" weight="medium" color="text-secondary">
            {totalDebtValueDecimalFormatted ?? '---'}
          </Typography>
        </div>
      </div>
      <div className="raft__protocol-stats__ratio">
        <Typography variant="overline" color="text-accent">
          COLLATERALIZATION
        </Typography>
        <div className="raft__protocol-stats__ratio__percent">
          <Typography variant="heading1">{collateralizationRatioFormatted ?? '---'}</Typography>
          <Typography variant="heading2">%</Typography>
        </div>
        <div className="raft__protocol-stats__ratio__status">
          <div className={`raft__protocol-stats__ratio__status__color status-risk-${collateralRatioLevel}`} />
          <Typography variant="body" weight="medium" color="text-secondary">
            {collateralRatioLabel ?? '---'}
          </Typography>
        </div>
      </div>
    </div>
  );
};

export default memo(ProtocolStats);
