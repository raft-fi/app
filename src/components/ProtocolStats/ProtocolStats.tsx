import { DecimalFormat } from 'tempus-decimal';
import { memo, useCallback, useMemo, useState } from 'react';
import { ButtonWrapper, TokenLogo } from 'tempus-ui';
import { useTokenPrices } from '../../hooks';
import { Icon, Typography, ValuesBox, ValueLabel } from '../shared';

import './ProtocolStats.scss';

const ProtocolStats = () => {
  const tokenPriceMap = useTokenPrices();
  const [expanded, setExpanded] = useState<boolean>(true);

  const stETHPriceFormatted = useMemo(
    () =>
      tokenPriceMap.stETH
        ? DecimalFormat.format(tokenPriceMap.stETH, { style: 'currency', currency: '$', fractionDigits: 2 })
        : '---',
    [tokenPriceMap.stETH],
  );
  const rPriceFormatted = useMemo(
    () =>
      tokenPriceMap.R
        ? DecimalFormat.format(tokenPriceMap.R, { style: 'currency', currency: '$', fractionDigits: 2 })
        : '---',
    [tokenPriceMap.R],
  );

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
            <TokenLogo type="token-stETH" />
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
                <ValueLabel value="1.62M stETH" />
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
                <ValueLabel value="$300.2M" />
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
                <ValueLabel value={stETHPriceFormatted} />
              </div>
            </div>
          </div>
          <div className="raft__protocol-stats__stat">
            <TokenLogo type="token-R" />
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
                <ValueLabel value="215.2M R" />
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
                <ValueLabel value="$215.2M" />
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
                <ValueLabel value={rPriceFormatted} />
              </div>
            </div>
          </div>
        </div>
        <ValuesBox
          values={[
            {
              id: 'collateralizationRatio',
              label: 'Protocol collateralization ratio',
              value: '262%',
            },
            {
              id: 'openPositions',
              label: 'Open positions',
              value: '50,000',
            },
            {
              id: 'borrowingFee',
              label: 'Borrowing fee',
              value: '0.00%',
            },
          ]}
        />
      </div>
    </div>
  );
};

export default memo(ProtocolStats);
