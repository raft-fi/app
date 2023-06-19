import { Decimal, DecimalFormat } from '@tempusfinance/decimal';
import { memo, useMemo } from 'react';
import { TokenLogo } from 'tempus-ui';
import { R_TOKEN } from '@raft-fi/sdk';
import { useCollateralConversionRates, useProtocolStats, useTokenPrices } from '../../hooks';
import { getProtocolCollateralRatioLabel, getProtocolCollateralRatioLevel, getTokenValues } from '../../utils';
import { COLLATERAL_TOKEN_UI_PRECISION, USD_UI_PRECISION } from '../../constants';
import { Typography } from '../shared';

import './ProtocolStats.scss';

const collateralThreshold = 1000; // 1k

const ProtocolStats = () => {
  const protocolStats = useProtocolStats();
  const tokenPriceMap = useTokenPrices();
  const collateralConversionRateMap = useCollateralConversionRates();

  const displayCollateralTotalSupplyValues = useMemo(() => {
    if (!protocolStats || !collateralConversionRateMap?.stETH) {
      return null;
    }

    // TODO - Return per token values instead of single wstETH value
    const wstETHSupply = protocolStats.collateralSupply['wstETH'];
    if (!wstETHSupply) {
      return null;
    }

    const amount = wstETHSupply.mul(collateralConversionRateMap.stETH);

    // TODO: change it later, display in USD value instead
    return getTokenValues(amount, tokenPriceMap['stETH'], 'stETH');
  }, [collateralConversionRateMap, protocolStats, tokenPriceMap]);

  const underlyingCollateralTotalSupplyValues = useMemo(() => {
    if (!protocolStats) {
      return null;
    }

    // TODO - Return per token values instead of single wstETH value
    const wstETHSupply = protocolStats.collateralSupply['wstETH'];
    if (!wstETHSupply) {
      return null;
    }

    // TODO: change it later, display in USD value instead
    return getTokenValues(wstETHSupply, tokenPriceMap['wstETH'], 'wstETH');
  }, [protocolStats, tokenPriceMap]);

  const debtTotalSupplyValues = useMemo(() => {
    if (!protocolStats) {
      return null;
    }

    // TODO - Return per token values instead of single wstETH value
    const wstETHSupply = protocolStats.debtSupply['wstETH'];
    if (!wstETHSupply) {
      return null;
    }

    return getTokenValues(wstETHSupply, tokenPriceMap[R_TOKEN], R_TOKEN);
  }, [protocolStats, tokenPriceMap]);

  const displayCollateralTotalSupplyAmountFormatted = useMemo(() => {
    if (displayCollateralTotalSupplyValues?.amount) {
      let fractionDigits = COLLATERAL_TOKEN_UI_PRECISION;

      if (displayCollateralTotalSupplyValues?.amount.gte(collateralThreshold)) {
        fractionDigits = 0;
      }

      return DecimalFormat.format(displayCollateralTotalSupplyValues.amount, {
        style: 'decimal',
        fractionDigits,
      });
    }

    return null;
  }, [displayCollateralTotalSupplyValues?.amount]);

  const underlyingCollateralTotalSupplyValueFormatted = useMemo(
    () =>
      underlyingCollateralTotalSupplyValues?.value
        ? DecimalFormat.format(underlyingCollateralTotalSupplyValues.value, {
            style: 'decimal',
            fractionDigits: USD_UI_PRECISION,
          })
        : null,
    [underlyingCollateralTotalSupplyValues?.value],
  );

  const debtTotalSupplyAmountFormatted = useMemo(
    () =>
      debtTotalSupplyValues?.amount
        ? DecimalFormat.format(debtTotalSupplyValues.amount, {
            style: 'decimal',
            fractionDigits: 0,
          })
        : null,
    [debtTotalSupplyValues?.amount],
  );
  const debtTotalSupplyValueFormatted = useMemo(
    () =>
      debtTotalSupplyValues?.value
        ? DecimalFormat.format(debtTotalSupplyValues.value, {
            style: 'decimal',
            fractionDigits: USD_UI_PRECISION,
          })
        : null,
    [debtTotalSupplyValues?.value],
  );

  const collateralizationRatio = useMemo(() => {
    if (!underlyingCollateralTotalSupplyValues?.value || !debtTotalSupplyValues?.value) {
      return null;
    }

    if (underlyingCollateralTotalSupplyValues.value.isZero()) {
      return Decimal.ZERO;
    }

    return underlyingCollateralTotalSupplyValues.value.div(debtTotalSupplyValues.value);
  }, [underlyingCollateralTotalSupplyValues?.value, debtTotalSupplyValues?.value]);

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
          TOTAL VALUE LOCKED
        </Typography>
        <div className="raft__protocol-stats__collateral__amount">
          <TokenLogo type="token-stETH" size="small" />
          <div className="raft__protocol-stats__collateral__amount__number">
            <Typography variant="heading1">{displayCollateralTotalSupplyAmountFormatted ?? '---'}</Typography>
            <Typography variant="heading2">stETH</Typography>
          </div>
        </div>
        <div className="raft__protocol-stats__collateral__value__number">
          <Typography variant="caption" color="text-secondary">
            $
          </Typography>
          <Typography variant="body" weight="medium" color="text-secondary">
            {underlyingCollateralTotalSupplyValueFormatted ?? '---'}
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
            <Typography variant="heading1">{debtTotalSupplyAmountFormatted ?? '---'}</Typography>
            <Typography variant="heading2">{R_TOKEN}</Typography>
          </div>
        </div>
        <div className="raft__protocol-stats__debt__value__number">
          <Typography variant="caption" color="text-secondary">
            $
          </Typography>
          <Typography variant="body" weight="medium" color="text-secondary">
            {debtTotalSupplyValueFormatted ?? '---'}
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
