import { CSSProperties, FC, useMemo } from 'react';
import { R_TOKEN } from '@raft-fi/sdk';
import { TokenLogo } from 'tempus-ui';
import { DecimalFormat, Decimal } from '@tempusfinance/decimal';
import { R_TOKEN_UI_PRECISION } from '../../../constants';
import { Nullable } from '../../../interfaces';
import { Icon, Tooltip, TooltipWrapper, Typography, ValueLabel } from '../../shared';

import './Stats.scss';

type StatsProps = {
  currentSavings: Nullable<Decimal>;
  currentYield: Nullable<Decimal>;
  tvl: Nullable<Decimal>;
  savingsMaxDeposit?: Nullable<Decimal>;
};

const Stats: FC<StatsProps> = ({ currentSavings, currentYield, tvl, savingsMaxDeposit }) => {
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

  const currentYieldFormatted = useMemo(() => {
    if (!currentYield) {
      return null;
    }

    return DecimalFormat.format(currentYield, {
      style: 'percentage',
      fractionDigits: 2,
      lessThanFormat: true,
      pad: true,
    });
  }, [currentYield]);

  const currentTvlFormatted = useMemo(() => {
    if (!tvl) {
      return null;
    }

    return DecimalFormat.format(tvl, {
      style: 'currency',
      currency: R_TOKEN,
      fractionDigits: R_TOKEN_UI_PRECISION,
      lessThanFormat: true,
      pad: true,
    });
  }, [tvl]);

  const savingsMaxDepositFormatted = useMemo(() => {
    if (!savingsMaxDeposit) {
      return null;
    }

    return DecimalFormat.format(savingsMaxDeposit, {
      style: 'currency',
      currency: R_TOKEN,
      fractionDigits: R_TOKEN_UI_PRECISION,
      lessThanFormat: true,
      pad: true,
    });
  }, [savingsMaxDeposit]);

  const leftCapacityProgressBar = useMemo(() => {
    const totalCapacity = tvl?.add(savingsMaxDeposit || 0) || Decimal.ZERO;
    const capacity = tvl?.div(totalCapacity).mul(100);
    return `${capacity}%`;
  }, [tvl, savingsMaxDeposit]);

  const progressBarStyle: CSSProperties = {
    width: leftCapacityProgressBar,
  };

  return (
    <>
      {currentSavingsFormatted && (
        <div className="raft__savings__stats">
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
              <ValueLabel
                value={currentSavingsFormatted}
                valueSize="heading1"
                tickerSize="heading2"
                color="text-primary-inverted"
              />
            </div>
          </div>
        </div>
      )}

      <div className="raft__savings__stats">
        <div className="raft__savings__stats__item">
          <Typography variant="overline" weight="semi-bold" color="text-accent">
            CURRENT YIELD
          </Typography>
          {currentYieldFormatted ? (
            <ValueLabel value={currentYieldFormatted} valueSize="heading1" tickerSize="heading2" label="APR fixed" />
          ) : (
            '---'
          )}
        </div>
        <div className="raft__savings__stats__item">
          <Typography variant="overline" weight="semi-bold" color="text-accent">
            TOTAL VALUE LOCKED
          </Typography>
          <div className="raft__savings__stats__item-token">
            <TokenLogo type="token-R" size="small" />
            {currentTvlFormatted ? (
              <ValueLabel value={currentTvlFormatted} valueSize="heading1" tickerSize="heading2" />
            ) : (
              '---'
            )}
          </div>
        </div>
        <div className="raft__savings__stats__item">
          <Typography variant="overline" weight="semi-bold" color="text-accent">
            REMAINING CAPACITY
          </Typography>
          <div className="raft__savings__stats__item-token">
            <TokenLogo type="token-R" size="small" />
            {savingsMaxDepositFormatted ? (
              <ValueLabel value={savingsMaxDepositFormatted} valueSize="heading1" tickerSize="heading2" />
            ) : (
              '---'
            )}
          </div>
          <div className="raft__savings__stats__capacity__progress-bar__container">
            <div className="raft__savings__stats__capacity__progress-bar" style={progressBarStyle} />
          </div>
        </div>
      </div>
    </>
  );
};
export default Stats;
