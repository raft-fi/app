import { Decimal, DecimalFormat } from '@tempusfinance/decimal';
import { memo, useMemo } from 'react';
import { TokenLogo } from 'tempus-ui';
import { R_TOKEN, UnderlyingCollateralToken } from '@raft-fi/sdk';
import { useProtocolStats, useTokenPrices } from '../../hooks';
import { getProtocolCollateralRatioLabel, getProtocolCollateralRatioLevel, getTokenValues } from '../../utils';
import { SUPPORTED_UNDERLYING_TOKENS, USD_UI_PRECISION } from '../../constants';
import { Typography } from '../shared';
import { TokenDecimalMap } from '../../interfaces';

import './ProtocolStats.scss';

const ProtocolStats = () => {
  const protocolStats = useProtocolStats();
  const tokenPriceMap = useTokenPrices();

  const collateralSupplyMap = useMemo(
    () => protocolStats?.collateralSupply ?? ({} as TokenDecimalMap<UnderlyingCollateralToken>),
    [protocolStats?.collateralSupply],
  );
  const debtSupplyMap = useMemo(
    () => protocolStats?.debtSupply ?? ({} as TokenDecimalMap<UnderlyingCollateralToken>),
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
    () =>
      DecimalFormat.format(totalCollateralValue, {
        style: 'multiplier',
        fractionDigits: USD_UI_PRECISION,
      }),
    [totalCollateralValue],
  );
  const totalCollateralValueDecimalFormatted = useMemo(
    () =>
      DecimalFormat.format(totalCollateralValue, {
        style: 'decimal',
        fractionDigits: USD_UI_PRECISION,
      }),
    [totalCollateralValue],
  );
  const totalDebtAmountFormatted = useMemo(
    () =>
      totalDebtTokenValues.amount
        ? DecimalFormat.format(totalDebtTokenValues.amount, {
            style: 'decimal',
            fractionDigits: 0,
          })
        : null,
    [totalDebtTokenValues.amount],
  );
  const totalDebtValueDecimalFormatted = useMemo(
    () =>
      totalDebtTokenValues.value
        ? DecimalFormat.format(totalDebtTokenValues.value, {
            style: 'decimal',
            fractionDigits: USD_UI_PRECISION,
          })
        : null,
    [totalDebtTokenValues.value],
  );

  const collateralizationRatio = useMemo(() => {
    if (!totalDebtTokenValues.value || totalDebtTokenValues.value.isZero()) {
      return null;
    }

    return totalCollateralValue.div(totalDebtTokenValues.value);
  }, [totalDebtTokenValues.value, totalCollateralValue]);

  const collateralizationRatioFormatted = useMemo(
    () =>
      collateralizationRatio
        ? DecimalFormat.format(collateralizationRatio.mul(100), {
            style: 'decimal',
            fractionDigits: USD_UI_PRECISION,
          })
        : null,
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
        <Typography variant="overline" color="text-accent">
          PROTOCOL SUPPLY
        </Typography>
        <div className="raft__protocol-stats__collateral__amount">
          <TokenLogo type="token-stETH" size="small" />
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
