import { Decimal, DecimalFormat } from '@tempusfinance/decimal';
import { memo, useMemo } from 'react';
import { TokenLogo } from 'tempus-ui';
import { R_TOKEN } from '@raft-fi/sdk';
import { useProtocolStats, useTokenPrices } from '../../hooks';
import { getProtocolCollateralRatioLabel, getProtocolCollateralRatioLevel, getTokenValues } from '../../utils';
import {
  COLLATERAL_BASE_TOKEN,
  COLLATERAL_TOKEN_UI_PRECISION,
  DISPLAY_BASE_TOKEN,
  USD_UI_PRECISION,
} from '../../constants';
import { Typography } from '../shared';

import './ProtocolStats.scss';

const collateralThreshold = 1000; // 1k

const ProtocolStats = () => {
  const protocolStats = useProtocolStats();
  const tokenPriceMap = useTokenPrices();

  const displayBaseTokenValues = useMemo(() => {
    return getTokenValues(Decimal.ONE, tokenPriceMap[DISPLAY_BASE_TOKEN], DISPLAY_BASE_TOKEN);
  }, [tokenPriceMap]);

  const collateralTotalSupplyValues = useMemo(() => {
    if (!protocolStats || !displayBaseTokenValues.price || !tokenPriceMap[COLLATERAL_BASE_TOKEN]) {
      return null;
    }

    const amount = tokenPriceMap[COLLATERAL_BASE_TOKEN].mul(protocolStats.collateralSupply).div(
      displayBaseTokenValues.price,
    );

    return getTokenValues(amount, tokenPriceMap[DISPLAY_BASE_TOKEN], DISPLAY_BASE_TOKEN);
  }, [displayBaseTokenValues?.price, protocolStats, tokenPriceMap]);
  const debtTotalSupplyValues = useMemo(() => {
    if (!protocolStats) {
      return null;
    }

    return getTokenValues(protocolStats.debtSupply, tokenPriceMap[R_TOKEN], R_TOKEN);
  }, [protocolStats, tokenPriceMap]);

  const collateralTotalSupplyAmountFormatted = useMemo(() => {
    if (collateralTotalSupplyValues?.amount) {
      let fractionDigits = COLLATERAL_TOKEN_UI_PRECISION;

      if (collateralTotalSupplyValues?.amount.gte(collateralThreshold)) {
        fractionDigits = 0;
      }

      return DecimalFormat.format(collateralTotalSupplyValues.amount, {
        style: 'decimal',
        fractionDigits,
      });
    }

    return null;
  }, [collateralTotalSupplyValues?.amount]);
  const collateralTotalSupplyValueFormatted = useMemo(
    () =>
      collateralTotalSupplyValues?.value
        ? DecimalFormat.format(collateralTotalSupplyValues.value, {
            style: 'decimal',
            fractionDigits: USD_UI_PRECISION,
          })
        : null,
    [collateralTotalSupplyValues?.value],
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
    if (!collateralTotalSupplyValues?.value || !debtTotalSupplyValues?.value) {
      return null;
    }

    if (collateralTotalSupplyValues.value.isZero()) {
      return Decimal.ZERO;
    }

    return collateralTotalSupplyValues.value.div(debtTotalSupplyValues.value);
  }, [collateralTotalSupplyValues?.value, debtTotalSupplyValues?.value]);

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
          <TokenLogo type={`token-${DISPLAY_BASE_TOKEN}`} size="small" />
          <div className="raft__protocol-stats__collateral__amount__number">
            <Typography variant="heading1">{collateralTotalSupplyAmountFormatted ?? '---'}</Typography>
            <Typography variant="heading2">{DISPLAY_BASE_TOKEN}</Typography>
          </div>
        </div>
        <div className="raft__protocol-stats__collateral__value__number">
          <Typography variant="caption" color="text-secondary">
            $
          </Typography>
          <Typography variant="body" weight="medium" color="text-secondary">
            {collateralTotalSupplyValueFormatted ?? '---'}
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
