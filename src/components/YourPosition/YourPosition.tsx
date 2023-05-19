import { Decimal, DecimalFormat } from '@tempusfinance/decimal';
import { FC, memo, useCallback, useMemo, useState } from 'react';
import { ButtonWrapper, TokenLogo } from 'tempus-ui';
import { useProtocolStats, useTokenPrices } from '../../hooks';
import { getTokenValues } from '../../utils';
import { COLLATERAL_BASE_TOKEN, DISPLAY_BASE_TOKEN } from '../../constants';
import { Icon, Typography, ValuesBox, ValueLabel } from '../shared';

import './YourPosition.scss';
import { R_TOKEN } from '@raft-fi/sdk';

const YourPosition: FC = () => {
  const [expanded, setExpanded] = useState<boolean>(true);

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

  const onToggleExpanded = useCallback(() => setExpanded(expanded => !expanded), []);

  return (
    <div className="raft__your-position">
      <div className="raft__your-position__header">
        <Typography variant="subtitle" weight="medium">
          Your Position
        </Typography>
        <div className="raft__your-position__actions">
          <ButtonWrapper onClick={onToggleExpanded}>
            <Icon variant={expanded ? 'chevron-up' : 'chevron-down'} />
          </ButtonWrapper>
        </div>
      </div>
      <div className={`raft__your-position__body ${expanded ? 'raft__your-position-expanded' : ''}`}>
        <div className="raft__your-position__stat-token">
          <div className="raft__your-position__stat">
            <TokenLogo type={`token-${DISPLAY_BASE_TOKEN}`} />
            <div className="raft__your-position__stat__separator" />
            <div className="raft__your-position__stat__data">
              <Typography
                className="raft__your-position__stat__data__title"
                variant="body-tertiary"
                weight="semi-bold"
                color="text-accent"
              >
                Collateral amount
              </Typography>
              <div className="raft__your-position__stat__data__value">
                <ValueLabel value={collateralTotalSupplyValues?.amountFormattedMultiplier || '---'} />
              </div>
            </div>
            <div className="raft__your-position__stat__separator" />
            <div className="raft__your-position__stat__data">
              <Typography
                className="raft__your-position__stat__data__title"
                variant="body-tertiary"
                weight="semi-bold"
                color="text-accent"
              >
                Value
              </Typography>
              <div className="raft__your-position__stat__data__value">
                <ValueLabel value={collateralTotalSupplyValues?.valueFormattedMultiplier || '---'} />
              </div>
            </div>
            <div className="raft__your-position__stat__separator" />
            <div className="raft__your-position__stat__data">
              <Typography
                className="raft__your-position__stat__data__title"
                variant="body-tertiary"
                weight="semi-bold"
                color="text-accent"
              >
                Price
              </Typography>
              <div className="raft__your-position__stat__data__value">
                <ValueLabel value={displayBaseTokenValues.priceFormattedIntegral ?? '---'} />
              </div>
            </div>
          </div>
          <div className="raft__your-position__stat">
            <TokenLogo type={`token-${R_TOKEN}`} />
            <div className="raft__your-position__stat__separator" />
            <div className="raft__your-position__stat__data">
              <Typography
                className="raft__your-position__stat__data__title"
                variant="body-tertiary"
                weight="semi-bold"
                color="text-accent"
              >
                Debt amount
              </Typography>
              <div className="raft__your-position__stat__data__value">
                <ValueLabel value={debtTotalSupplyValues?.amountFormattedMultiplier || '---'} />
              </div>
            </div>
            <div className="raft__your-position__stat__separator" />
            <div className="raft__your-position__stat__data">
              <Typography
                className="raft__your-position__stat__data__title"
                variant="body-tertiary"
                weight="semi-bold"
                color="text-accent"
              >
                Value
              </Typography>
              <div className="raft__your-position__stat__data__value">
                <ValueLabel value={debtTotalSupplyValues?.valueFormattedMultiplier || '---'} />
              </div>
            </div>
            <div className="raft__your-position__stat__separator" />
            <div className="raft__your-position__stat__data">
              <Typography
                className="raft__your-position__stat__data__title"
                variant="body-tertiary"
                weight="semi-bold"
                color="text-accent"
              >
                Price
              </Typography>
              <div className="raft__your-position__stat__data__value">
                <ValueLabel value={raftTokenPriceFormatted || '---'} />
              </div>
            </div>
          </div>
        </div>
        <ValuesBox
          values={[
            {
              id: 'collateralizationRatio',
              label: 'Collateralization ratio',
              value: collateralizationRatioFormatted || '---',
            },
          ]}
        />
      </div>
    </div>
  );
};

export default memo(YourPosition);
