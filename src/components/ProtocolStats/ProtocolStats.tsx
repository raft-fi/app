import { Decimal, DecimalFormat } from '@tempusfinance/decimal';
import { memo, useMemo, useState } from 'react';
import { TokenLogo } from 'tempus-ui';
import { R_TOKEN } from '@raft-fi/sdk';
import { useProtocolStats, useTokenPrices } from '../../hooks';
import { getTokenValues } from '../../utils';
import { COLLATERAL_BASE_TOKEN, DISPLAY_BASE_TOKEN } from '../../constants';
import { Typography, ValuesBox, ValueLabel } from '../shared';

import './ProtocolStats.scss';

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

  const collateralizationRatio = useMemo(() => {
    if (!collateralTotalSupplyValues?.value || !debtTotalSupplyValues?.value) {
      return null;
    }

    if (collateralTotalSupplyValues.value.isZero()) {
      return Decimal.ZERO;
    }

    return collateralTotalSupplyValues.value.div(debtTotalSupplyValues.value);
  }, [collateralTotalSupplyValues?.value, debtTotalSupplyValues?.value]);

  const raftTokenPriceFormatted = useMemo(() => {
    if (!tokenPriceMap[R_TOKEN]) {
      return null;
    }

    return DecimalFormat.format(tokenPriceMap[R_TOKEN].toRounded(2), {
      style: 'currency',
      currency: '$',
      fractionDigits: 2,
      pad: true,
    });
  }, [tokenPriceMap]);

  const collateralizationRatioFormatted = useMemo(() => {
    if (!collateralizationRatio) {
      return null;
    }

    return DecimalFormat.format(collateralizationRatio, {
      style: 'percentage',
      fractionDigits: 2,
      pad: true,
    });
  }, [collateralizationRatio]);

  const openPositionsFormatted = useMemo(() => {
    if (!protocolStats) {
      return null;
    }

    return DecimalFormat.format(protocolStats.openPositions, {
      style: 'decimal',
      fractionDigits: 0,
    });
  }, [protocolStats]);

  const borrowingFeeFormatted = useMemo(() => {
    if (!protocolStats) {
      return null;
    }

    return DecimalFormat.format(protocolStats.borrowingRate, {
      style: 'percentage',
      fractionDigits: 2,
      pad: true,
    });
  }, [protocolStats]);

  return (
    <div className="raft__protocol-stats">
      <div className="raft__protocol-stats__header">
        <Typography variant="subtitle" weight="medium">
          Protocol stats
        </Typography>
      </div>
      <div className="raft__protocol-stats__body raft__protocol-stats-expanded">
        <div className="raft__protocol-stats__stat-token">
          <div className="raft__protocol-stats__stat">
            <TokenLogo type={`token-${DISPLAY_BASE_TOKEN}`} />
            <div className="raft__protocol-stats__stat__separator" />
            <div className="raft__protocol-stats__stat__data">
              <Typography
                className="raft__protocol-stats__stat__data__title"
                variant="body-tertiary"
                weight="semi-bold"
                color="text-secondary"
              >
                Total supply
              </Typography>
              <div className="raft__protocol-stats__stat__data__value">
                <ValueLabel value={collateralTotalSupplyValues?.amountFormattedMultiplier || '---'} />
              </div>
            </div>
            <div className="raft__protocol-stats__stat__separator" />
            <div className="raft__protocol-stats__stat__data">
              <Typography
                className="raft__protocol-stats__stat__data__title"
                variant="body-tertiary"
                weight="semi-bold"
                color="text-secondary"
              >
                Total value
              </Typography>
              <div className="raft__protocol-stats__stat__data__value">
                <ValueLabel value={collateralTotalSupplyValues?.valueFormattedMultiplier || '---'} />
              </div>
            </div>
            <div className="raft__protocol-stats__stat__separator" />
            <div className="raft__protocol-stats__stat__data">
              <Typography
                className="raft__protocol-stats__stat__data__title"
                variant="body-tertiary"
                weight="semi-bold"
                color="text-secondary"
              >
                Price
              </Typography>
              <div className="raft__protocol-stats__stat__data__value">
                <ValueLabel value={displayBaseTokenValues.priceFormattedIntegral ?? '---'} />
              </div>
            </div>
          </div>
          <div className="raft__protocol-stats__stat">
            <TokenLogo type={`token-${R_TOKEN}`} />
            <div className="raft__protocol-stats__stat__separator" />
            <div className="raft__protocol-stats__stat__data">
              <Typography
                className="raft__protocol-stats__stat__data__title"
                variant="body-tertiary"
                weight="semi-bold"
                color="text-secondary"
              >
                Total supply
              </Typography>
              <div className="raft__protocol-stats__stat__data__value">
                <ValueLabel value={debtTotalSupplyValues?.amountFormattedMultiplier || '---'} />
              </div>
            </div>
            <div className="raft__protocol-stats__stat__separator" />
            <div className="raft__protocol-stats__stat__data">
              <Typography
                className="raft__protocol-stats__stat__data__title"
                variant="body-tertiary"
                weight="semi-bold"
                color="text-secondary"
              >
                Total value
              </Typography>
              <div className="raft__protocol-stats__stat__data__value">
                <ValueLabel value={debtTotalSupplyValues?.valueFormattedMultiplier || '---'} />
              </div>
            </div>
            <div className="raft__protocol-stats__stat__separator" />
            <div className="raft__protocol-stats__stat__data">
              <Typography
                className="raft__protocol-stats__stat__data__title"
                variant="body-tertiary"
                weight="semi-bold"
                color="text-secondary"
              >
                Price
              </Typography>
              <div className="raft__protocol-stats__stat__data__value">
                <ValueLabel value={raftTokenPriceFormatted || '---'} />
              </div>
            </div>
          </div>
        </div>
        <ValuesBox
          values={[
            {
              id: 'collateralizationRatio',
              label: 'Protocol collateralization ratio',
              value: collateralizationRatioFormatted || '---',
            },
            {
              id: 'openPositions',
              label: 'Open Positions',
              value: openPositionsFormatted || '---',
            },
            {
              id: 'borrowingRate',
              label: 'Borrowing fee',
              value: borrowingFeeFormatted || '---',
            },
          ]}
        />
      </div>
    </div>
  );
};

export default memo(ProtocolStats);
