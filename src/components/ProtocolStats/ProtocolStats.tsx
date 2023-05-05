import { Decimal, DecimalFormat } from 'tempus-decimal';
import { memo, useCallback, useMemo, useState } from 'react';
import { ButtonWrapper, TokenLogo } from 'tempus-ui';
import { useProtocolStats, useTokenPrices } from '../../hooks';
import { DISPLAY_BASE_TOKEN, RAFT_TOKEN, COLLATERAL_BASE_TOKEN } from '../../interfaces';
import { getTokenValues } from '../../utils';
import { Icon, Typography, ValuesBox, ValueLabel } from '../shared';

import './ProtocolStats.scss';

const ProtocolStats = () => {
  const protocolStats = useProtocolStats();
  const tokenPriceMap = useTokenPrices();
  const [expanded, setExpanded] = useState<boolean>(true);

  const displayBaseTokenValues = useMemo(() => {
    return getTokenValues(Decimal.ONE, tokenPriceMap[DISPLAY_BASE_TOKEN], DISPLAY_BASE_TOKEN);
  }, [tokenPriceMap]);

  const raftTokenValues = useMemo(() => {
    return getTokenValues(Decimal.ONE, tokenPriceMap[RAFT_TOKEN], RAFT_TOKEN);
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

    return getTokenValues(protocolStats.debtSupply, tokenPriceMap[RAFT_TOKEN], RAFT_TOKEN);
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

  const onToggleExpanded = useCallback(() => setExpanded(expanded => !expanded), []);

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
                <ValueLabel value={collateralTotalSupplyValues?.amountFormattedMultiplier || '---'} />
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
                <ValueLabel value={collateralTotalSupplyValues?.valueFormattedMultiplier || '---'} />
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
                <ValueLabel value={displayBaseTokenValues.priceFormattedIntegral ?? '---'} />
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
                <ValueLabel value={debtTotalSupplyValues?.amountFormattedMultiplier || '---'} />
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
                <ValueLabel value={debtTotalSupplyValues?.valueFormattedMultiplier || '---'} />
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
                <ValueLabel value={raftTokenValues.priceFormatted || '---'} />
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
