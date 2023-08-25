import { useMemo } from 'react';
import { TokenLogo } from 'tempus-ui';
import { R_TOKEN } from '@raft-fi/sdk';
import { DecimalFormat } from '@tempusfinance/decimal';
import { R_TOKEN_UI_PRECISION } from '../../../constants';
import { useCurrentUserSavings } from '../../../hooks';
import { Icon, Tooltip, TooltipWrapper, Typography, ValueLabel } from '../../shared';

import './Stats.scss';

const Stats = () => {
  const currentSavings = useCurrentUserSavings();

  const currentYield = '5.00%';
  const TVL = '1,234,556.00 R';
  const capacity = '1,234,556.00 R';

  const showSavings = true;

  const currentSavingsFormatted = useMemo(() => {
    if (!currentSavings) {
      return null;
    }

    return DecimalFormat.format(currentSavings, {
      style: 'currency',
      currency: R_TOKEN,
      fractionDigits: R_TOKEN_UI_PRECISION,
      lessThanFormat: true,
      pad: true,
    });
  }, [currentSavings]);

  return (
    <div className="raft__savings__stats">
      {showSavings && (
        <div className="raft__savings__stats__item raft__savings__stats__item-inverse">
          <div className="raft__savings__stats__item-title">
            <Typography variant="overline" weight="semi-bold" color="text-accent-inverted">
              YOUR SAVINGS
            </Typography>
            <TooltipWrapper
              tooltipContent={
                <Tooltip className="raft__leveragePositionAfter__infoTooltip">
                  <Typography variant="body2">
                    Your savings include your deposited amount plus earned rewards.
                  </Typography>
                </Tooltip>
              }
              placement="bottom"
            >
              <Icon variant="info" size="tiny" color="var(--textAccentInverted)" />
            </TooltipWrapper>
          </div>
          <div className="raft__savings__stats__item-token">
            <TokenLogo type="token-R" size="small" />
            {currentSavingsFormatted ? (
              <ValueLabel
                value={currentSavingsFormatted}
                valueSize="heading1"
                tickerSize="heading2"
                color="text-primary-inverted"
              />
            ) : (
              '---'
            )}
          </div>
        </div>
      )}

      <div className="raft__savings__stats__item">
        <Typography variant="overline" weight="semi-bold" color="text-accent">
          CURRENT YIELD
        </Typography>
        <ValueLabel value={currentYield} valueSize="heading1" tickerSize="heading2" label="APR fixed" />
      </div>
      <div className="raft__savings__stats__item">
        <Typography variant="overline" weight="semi-bold" color="text-accent">
          TOTAL VALUE LOCKED
        </Typography>
        <div className="raft__savings__stats__item-token">
          <TokenLogo type="token-R" size="small" />
          <ValueLabel value={TVL} valueSize="heading1" tickerSize="heading2" />
        </div>
      </div>
      <div className="raft__savings__stats__item">
        <Typography variant="overline" weight="semi-bold" color="text-accent">
          REMAINING CAPACITY
        </Typography>
        <div className="raft__savings__stats__item-token">
          <TokenLogo type="token-R" size="small" />
          <ValueLabel value={capacity} valueSize="heading1" tickerSize="heading2" />
        </div>
      </div>
    </div>
  );
};
export default Stats;
