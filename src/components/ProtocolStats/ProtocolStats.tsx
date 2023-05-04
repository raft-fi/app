import { DecimalFormat } from 'tempus-decimal';
import { memo, useCallback, useMemo, useState } from 'react';
import { ButtonWrapper, TokenLogo } from 'tempus-ui';
import { useProtocolStats, useTokenPrices } from '../../hooks';
import { DISPLAY_BASE_TOKEN, RAFT_TOKEN, COLLATERAL_BASE_TOKEN } from '../../interfaces';
import { Icon, Typography, ValuesBox, ValueLabel } from '../shared';

import './ProtocolStats.scss';

const ProtocolStats = () => {
  const protocolStats = useProtocolStats();
  const tokenPriceMap = useTokenPrices();
  const [expanded, setExpanded] = useState<boolean>(true);

  const displayBaseTokenPrice = useMemo(() => tokenPriceMap[DISPLAY_BASE_TOKEN], [tokenPriceMap]);

  const displayBaseTokenPriceFormatted = useMemo(
    () =>
      displayBaseTokenPrice
        ? DecimalFormat.format(displayBaseTokenPrice, {
            style: 'currency',
            currency: '$',
            fractionDigits: 2,
          })
        : '---',
    [displayBaseTokenPrice],
  );

  const raftTokenPrice = useMemo(() => tokenPriceMap[RAFT_TOKEN], [tokenPriceMap]);

  const raftTokenPriceFormatted = useMemo(
    () =>
      raftTokenPrice
        ? DecimalFormat.format(raftTokenPrice, { style: 'currency', currency: '$', fractionDigits: 4 })
        : '---',
    [raftTokenPrice],
  );

  const onToggleExpanded = useCallback(() => setExpanded(expanded => !expanded), []);

  const baseCollateralTokenPrice = useMemo(() => tokenPriceMap[COLLATERAL_BASE_TOKEN], [tokenPriceMap]);

  const totalSupply = useMemo(() => {
    if (!baseCollateralTokenPrice || !protocolStats || !displayBaseTokenPrice) {
      return null;
    }

    return baseCollateralTokenPrice.mul(protocolStats.collateralSupply).div(displayBaseTokenPrice);
  }, [baseCollateralTokenPrice, displayBaseTokenPrice, protocolStats]);

  const totalSupplyFormatted = useMemo(() => {
    if (!totalSupply) {
      return null;
    }

    return DecimalFormat.format(totalSupply, {
      style: 'multiplier',
      currency: DISPLAY_BASE_TOKEN,
      fractionDigits: 2,
      noMultiplierFractionDigits: 4,
      lessThanFormat: true,
    });
  }, [totalSupply]);

  const totalCollateralValue = useMemo(() => {
    if (!baseCollateralTokenPrice || !protocolStats) {
      return null;
    }

    return baseCollateralTokenPrice.mul(protocolStats.collateralSupply);
  }, [baseCollateralTokenPrice, protocolStats]);

  const totalCollateralValueFormatted = useMemo(() => {
    if (!totalCollateralValue) {
      return null;
    }

    return DecimalFormat.format(totalCollateralValue, {
      style: 'multiplier',
      currency: '$',
      fractionDigits: 2,
      noMultiplierFractionDigits: 2,
      lessThanFormat: true,
    });
  }, [totalCollateralValue]);

  const totalDebtFormatted = useMemo(() => {
    if (!protocolStats) {
      return null;
    }

    return DecimalFormat.format(protocolStats.debtSupply, {
      style: 'multiplier',
      currency: RAFT_TOKEN,
      fractionDigits: 2,
      noMultiplierFractionDigits: 2,
      lessThanFormat: true,
    });
  }, [protocolStats]);

  const totalDebtValue = useMemo(() => {
    if (!raftTokenPrice || !protocolStats) {
      return null;
    }

    return raftTokenPrice.mul(protocolStats.debtSupply);
  }, [protocolStats, raftTokenPrice]);

  const totalDebtValueFormatted = useMemo(() => {
    if (!totalDebtValue) {
      return null;
    }

    return DecimalFormat.format(totalDebtValue, {
      style: 'multiplier',
      currency: '$',
      fractionDigits: 2,
      noMultiplierFractionDigits: 2,
      lessThanFormat: true,
    });
  }, [totalDebtValue]);

  const collateralizationRatio = useMemo(() => {
    if (!totalCollateralValue || !totalDebtValue) {
      return null;
    }

    return totalCollateralValue.div(totalDebtValue);
  }, [totalCollateralValue, totalDebtValue]);

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
        <Typography variant="subtitle">Protocol stats</Typography>
        <ButtonWrapper onClick={onToggleExpanded}>
          <Icon variant={expanded ? 'chevron-up' : 'chevron-down'} />
        </ButtonWrapper>
      </div>
      <div className={`raft__protocol-stats__body ${expanded ? 'raft__protocol-stats-expanded' : ''}`}>
        <div className="raft__protocol-stats__stat-token">
          <div className="raft__protocol-stats__stat">
            <TokenLogo type={`token-${DISPLAY_BASE_TOKEN}`} />
            <div className="raft__protocol-stats__stat__separator" />
            <div className="raft__protocol-stats__stat__data">
              <Typography
                className="raft__protocol-stats__stat__data__title"
                variant="body-tertiary"
                color="text-secondary"
              >
                Total supply
              </Typography>
              <div className="raft__protocol-stats__stat__data__value">
                <ValueLabel value={totalSupplyFormatted || '---'} />
              </div>
            </div>
            <div className="raft__protocol-stats__stat__separator" />
            <div className="raft__protocol-stats__stat__data">
              <Typography
                className="raft__protocol-stats__stat__data__title"
                variant="body-tertiary"
                color="text-secondary"
              >
                Total value
              </Typography>
              <div className="raft__protocol-stats__stat__data__value">
                <ValueLabel value={totalCollateralValueFormatted || '---'} />
              </div>
            </div>
            <div className="raft__protocol-stats__stat__separator" />
            <div className="raft__protocol-stats__stat__data">
              <Typography
                className="raft__protocol-stats__stat__data__title"
                variant="body-tertiary"
                color="text-secondary"
              >
                Price
              </Typography>
              <div className="raft__protocol-stats__stat__data__value">
                <ValueLabel value={displayBaseTokenPriceFormatted} />
              </div>
            </div>
          </div>
          <div className="raft__protocol-stats__stat">
            <TokenLogo type={`token-${RAFT_TOKEN}`} />
            <div className="raft__protocol-stats__stat__separator" />
            <div className="raft__protocol-stats__stat__data">
              <Typography
                className="raft__protocol-stats__stat__data__title"
                variant="body-tertiary"
                color="text-secondary"
              >
                Total supply
              </Typography>
              <div className="raft__protocol-stats__stat__data__value">
                <ValueLabel value={totalDebtFormatted || '---'} />
              </div>
            </div>
            <div className="raft__protocol-stats__stat__separator" />
            <div className="raft__protocol-stats__stat__data">
              <Typography
                className="raft__protocol-stats__stat__data__title"
                variant="body-tertiary"
                color="text-secondary"
              >
                Total value
              </Typography>
              <div className="raft__protocol-stats__stat__data__value">
                <ValueLabel value={totalDebtValueFormatted || '---'} />
              </div>
            </div>
            <div className="raft__protocol-stats__stat__separator" />
            <div className="raft__protocol-stats__stat__data">
              <Typography
                className="raft__protocol-stats__stat__data__title"
                variant="body-tertiary"
                color="text-secondary"
              >
                Price
              </Typography>
              <div className="raft__protocol-stats__stat__data__value">
                <ValueLabel value={raftTokenPriceFormatted} />
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
              label: 'Open positions',
              value: '50,000',
            },
            {
              id: 'borrowingRate',
              label: 'Borrowing rate',
              value: borrowingFeeFormatted || '---',
            },
          ]}
        />
      </div>
    </div>
  );
};

export default memo(ProtocolStats);
