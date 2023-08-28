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

  const currentTvlMultiplier = useMemo(() => {
    if (!tvl) {
      return null;
    }

    return DecimalFormat.format(tvl, {
      style: 'multiplier',
      currency: R_TOKEN,
      fractionDigits: R_TOKEN_UI_PRECISION,
      lessThanFormat: true,
      pad: true,
    });
  }, [tvl]);

  const shouldShowSavings = useMemo(
    () => currentSavings && currentSavings.gt(Decimal.ZERO) && currentSavingsFormatted,
    [currentSavings, currentSavingsFormatted],
  );

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

  const totalCapacity = useMemo(() => {
    if (!savingsMaxDeposit || !tvl) {
      return null;
    }

    return tvl.add(savingsMaxDeposit);
  }, [tvl, savingsMaxDeposit]);

  const totalCapacityMultiplier = useMemo(() => {
    if (!totalCapacity) {
      return null;
    }

    return DecimalFormat.format(totalCapacity, {
      style: 'multiplier',
      currency: R_TOKEN,
      fractionDigits: R_TOKEN_UI_PRECISION,
      lessThanFormat: true,
      pad: true,
    });
  }, [totalCapacity]);

  const leftCapacityProgressBar = useMemo(() => {
    const capacity = tvl?.div(totalCapacity || -1).mul(100);
    return `${capacity}%`;
  }, [tvl, totalCapacity]);

  const progressBarStyle: CSSProperties = {
    width: leftCapacityProgressBar,
  };

  return (
    <>
      {shouldShowSavings && (
        <div className="raft__savings__stats">
          <div className="raft__savings__stats__item raft__savings__stats__item-inverse">
            <div className="raft__savings__stats__item-title">
              <Typography variant="overline" weight="semi-bold" color="text-accent-inverted">
                YOUR SAVINGS
              </Typography>
              <TooltipWrapper
                tooltipContent={
                  <Tooltip className="raft__savings__tooltip">
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
                value={currentSavingsFormatted as string}
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
          <TooltipWrapper
            tooltipContent={
              <Tooltip className="raft__savings__tvlTooltip-container">
                <div className="raft__savings__tvlTooltip">
                  <Typography variant="overline" color="text-secondary">
                    TOTAL VALUE LOCKED
                  </Typography>
                  {currentTvlFormatted ? (
                    <div className="raft__savings__stats__item-token">
                      <TokenLogo type="token-R" size="small" />
                      <ValueLabel value={currentTvlFormatted} valueSize="body" tickerSize="caption" />
                    </div>
                  ) : (
                    '---'
                  )}
                  <div className="raft__savings__tvlTooltip-container__spacer" />
                  <Typography variant="overline" color="text-secondary">
                    SAVINGS CAPACITY
                  </Typography>
                  {savingsMaxDepositFormatted ? (
                    <div className="raft__savings__stats__item-token">
                      <TokenLogo type="token-R" size="small" />
                      <ValueLabel value={savingsMaxDepositFormatted} valueSize="body" tickerSize="caption" />
                    </div>
                  ) : (
                    '---'
                  )}
                </div>
              </Tooltip>
            }
            placement="bottom"
          >
            <Typography variant="overline" weight="semi-bold" color="text-accent">
              TOTAL VALUE LOCKED
            </Typography>
            <div className="raft__savings__stats__item-token">
              <TokenLogo type="token-R" size="small" />
              {currentTvlMultiplier ? (
                <ValueLabel value={currentTvlMultiplier} valueSize="heading1" tickerSize="heading2" />
              ) : (
                '---'
              )}
              <div className="raft__savings__divider">
                <Typography variant="heading1" weight="medium" color="text-disabled">
                  /
                </Typography>
              </div>
              {totalCapacityMultiplier ? (
                <ValueLabel value={totalCapacityMultiplier} valueSize="heading1" tickerSize="heading2" />
              ) : (
                '---'
              )}
            </div>
            <div className="raft__savings__stats__capacity__progress-bar__container">
              <div className="raft__savings__stats__capacity__progress-bar" style={progressBarStyle} />
            </div>
          </TooltipWrapper>
        </div>
      </div>
    </>
  );
};
export default Stats;
