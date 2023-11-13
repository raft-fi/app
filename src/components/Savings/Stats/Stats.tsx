import { FC, useMemo } from 'react';
import { R_TOKEN } from '@raft-fi/sdk';
import { TokenLogo } from '@tempusfinance/common-ui';
import { DecimalFormat, Decimal } from '@tempusfinance/decimal';
import { R_TOKEN_UI_PRECISION } from '../../../constants';
import { Nullable } from '../../../interfaces';
import { Icon, Tooltip, TooltipWrapper, Typography, ValueLabel } from '../../shared';
import { useCurrentSavingsNetwork, useSavingsStats } from '../../../hooks';
import SavingsStatBreakdownTooltip from './SavingsStatBreakdownTooltip';

import './Stats.scss';

type StatsProps = {
  currentSavings: Nullable<Decimal>;
};

const Stats: FC<StatsProps> = ({ currentSavings }) => {
  const savingsStats = useSavingsStats();
  const selectedNetwork = useCurrentSavingsNetwork();

  const currentYield = useMemo(() => savingsStats[selectedNetwork].currentYield, [savingsStats, selectedNetwork]);

  const totalSavingsTvl = useMemo(
    () => Object.values(savingsStats).reduce((total, stat) => total.add(stat.tvl ?? Decimal.ZERO), Decimal.ZERO),
    [savingsStats],
  );

  const totalSavingsYieldReserve = useMemo(
    () =>
      Object.values(savingsStats).reduce((total, stat) => total.add(stat.yieldReserve ?? Decimal.ZERO), Decimal.ZERO),
    [savingsStats],
  );

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

  const currentTvlMultiplier = useMemo(
    () =>
      DecimalFormat.format(totalSavingsTvl, {
        style: 'multiplier',
        currency: R_TOKEN,
        fractionDigits: R_TOKEN_UI_PRECISION,
        lessThanFormat: true,
        pad: true,
      }),
    [totalSavingsTvl],
  );

  const currentYieldReserveMultiplier = useMemo(
    () =>
      DecimalFormat.format(totalSavingsYieldReserve, {
        style: 'multiplier',
        currency: R_TOKEN,
        fractionDigits: R_TOKEN_UI_PRECISION,
        lessThanFormat: true,
        pad: true,
      }),
    [totalSavingsYieldReserve],
  );

  const shouldShowSavings = useMemo(
    () => currentSavings && currentSavings.gt(Decimal.ZERO) && currentSavingsFormatted,
    [currentSavings, currentSavingsFormatted],
  );

  return (
    <>
      {shouldShowSavings && (
        <div className="raft__savings__stats raft__savings__stats-inverse">
          <div className="raft__savings__stats__item">
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
          <div className="raft__savings__stats__item-title ">
            <Typography variant="overline" weight="semi-bold" color="text-accent">
              TOTAL VALUE LOCKED
            </Typography>
            <TooltipWrapper
              tooltipContent={<SavingsStatBreakdownTooltip stats={savingsStats} field="tvl" />}
              placement="bottom"
            >
              <Icon variant="info" size="tiny" />
            </TooltipWrapper>
          </div>
          <div className="raft__savings__stats__item-token">
            <TokenLogo type="token-R" size="small" />
            {currentTvlMultiplier ? (
              <ValueLabel value={currentTvlMultiplier} valueSize="heading1" tickerSize="heading2" />
            ) : (
              '---'
            )}
          </div>
        </div>
        <div className="raft__savings__stats__item">
          <div className="raft__savings__stats__item-title ">
            <Typography variant="overline" weight="semi-bold" color="text-accent">
              YIELD RESERVE
            </Typography>
            <TooltipWrapper
              tooltipContent={<SavingsStatBreakdownTooltip stats={savingsStats} field="yieldReserve" />}
              placement="bottom"
            >
              <Icon variant="info" size="tiny" />
            </TooltipWrapper>
          </div>
          <div className="raft__savings__stats__item-token">
            <TokenLogo type="token-R" size="small" />
            {currentYieldReserveMultiplier ? (
              <ValueLabel value={currentYieldReserveMultiplier} valueSize="heading1" tickerSize="heading2" />
            ) : (
              '---'
            )}
          </div>
        </div>
      </div>
    </>
  );
};
export default Stats;
