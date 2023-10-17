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
import { SUPPORTED_UNDERLYING_TOKENS, USD_UI_PRECISION } from '../../constants';
import { Icon, TooltipWrapper, Typography } from '../shared';
import { SupportedUnderlyingCollateralToken, TokenDecimalMap } from '../../interfaces';
import CollateralStatsBreakdown from './CollateralStatsBreakdown';

import './ProtocolStats.scss';

const R_MARKET_CAP_THRESHOLD = 1000000; // one million

const ProtocolStats = () => {
  const protocolStats = useProtocolStats();
  const tokenPriceMap = useTokenPrices();

  const collateralSupplyMap = useMemo(
    () => protocolStats?.collateralSupply ?? ({} as TokenDecimalMap<SupportedUnderlyingCollateralToken>),
    [protocolStats?.collateralSupply],
  );

  const totalCollateralValue = useMemo(() => {
    if (!protocolStats) {
      return null;
    }

    const collateralTvl = SUPPORTED_UNDERLYING_TOKENS.reduce((sum, underlyingCollateralToken) => {
      const supply = collateralSupplyMap[underlyingCollateralToken];
      const tokenValues = getTokenValues(supply, tokenPriceMap[underlyingCollateralToken], underlyingCollateralToken);
      return sum.add(tokenValues.value ?? Decimal.ZERO);
    }, Decimal.ZERO);

    const psmTvl = protocolStats.psmTvlFiat;

    return collateralTvl.add(psmTvl);
  }, [collateralSupplyMap, protocolStats, tokenPriceMap]);

  const rTotalSupplyValues = useMemo(() => {
    return getTokenValues(protocolStats?.totalRSupply || Decimal.ZERO, tokenPriceMap.R, R_TOKEN);
  }, [protocolStats, tokenPriceMap.R]);

  const totalCollateralValueMultiplierFormatted = useMemo(
    () => formatMultiplier(totalCollateralValue),
    [totalCollateralValue],
  );
  const totalCollateralValueDecimalFormatted = useMemo(
    () => formatDecimal(totalCollateralValue, USD_UI_PRECISION),
    [totalCollateralValue],
  );
  const rTotalSupplyAmountFormatted = useMemo(
    () =>
      rTotalSupplyValues.amount?.gt(R_MARKET_CAP_THRESHOLD)
        ? formatMultiplier(rTotalSupplyValues.amount)
        : formatDecimal(rTotalSupplyValues.amount, 0),
    [rTotalSupplyValues.amount],
  );
  const rTotalSupplyValueFormatted = useMemo(
    () => formatDecimal(rTotalSupplyValues.value, USD_UI_PRECISION),
    [rTotalSupplyValues.value],
  );

  const collateralizationRatio = useMemo(() => {
    if (!rTotalSupplyValues.value || rTotalSupplyValues.value.isZero() || !totalCollateralValue) {
      return null;
    }

    return totalCollateralValue.div(rTotalSupplyValues.value);
  }, [rTotalSupplyValues.value, totalCollateralValue]);

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
      <div className="raft__protocol-stats__collateral">
        <div className="raft__protocol-stats__collateral__title">
          <Typography variant="overline" color="text-accent">
            TOTAL VALUE LOCKED
          </Typography>
          <TooltipWrapper tooltipContent={<CollateralStatsBreakdown />} placement="bottom">
            <Icon variant="info" size="tiny" />
          </TooltipWrapper>
        </div>
        <div className="raft__protocol-stats__collateral__amount">
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
      <div className="raft__protocol-stats__debt">
        <Typography variant="overline" color="text-accent">
          R MARKET CAP
        </Typography>
        <div className="raft__protocol-stats__debt__amount">
          <TokenLogo type={`token-${R_TOKEN}`} size="small" />
          <div className="raft__protocol-stats__debt__amount__number">
            <Typography variant="heading1">{rTotalSupplyAmountFormatted ?? '---'}</Typography>
            <Typography variant="heading2">{R_TOKEN}</Typography>
          </div>
        </div>
        <div className="raft__protocol-stats__debt__value__number">
          <Typography variant="caption" color="text-secondary">
            $
          </Typography>
          <Typography variant="body" weight="medium" color="text-secondary">
            {rTotalSupplyValueFormatted ?? '---'}
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
