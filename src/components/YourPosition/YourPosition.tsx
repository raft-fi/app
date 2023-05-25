import { R_TOKEN } from '@raft-fi/sdk';
import { DecimalFormat } from '@tempusfinance/decimal';
import { FC, memo, useMemo } from 'react';
import { TokenLogo } from 'tempus-ui';
import {
  COLLATERAL_BASE_TOKEN,
  COLLATERAL_TOKEN_UI_PRECISION,
  DISPLAY_BASE_TOKEN,
  R_TOKEN_UI_PRECISION,
  USD_UI_PRECISION,
} from '../../constants';
import { useCollateralBalance, useDebtBalance, useTokenPrices } from '../../hooks';
import { getCollateralRatioLevel, getTokenValues } from '../../utils';
import { Typography } from '../shared';

import './YourPosition.scss';

const YourPosition: FC = () => {
  const collateralBalance = useCollateralBalance();
  const debtBalance = useDebtBalance();
  const tokenPriceMap = useTokenPrices();

  const collateralTokenValues = useMemo(
    () => getTokenValues(collateralBalance, tokenPriceMap[COLLATERAL_BASE_TOKEN], COLLATERAL_BASE_TOKEN),
    [collateralBalance, tokenPriceMap],
  );
  const debtTokenValues = useMemo(
    () => getTokenValues(debtBalance, tokenPriceMap[R_TOKEN], R_TOKEN),
    [debtBalance, tokenPriceMap],
  );
  const collateralInDisplayToken = useMemo(() => {
    if (
      !collateralTokenValues.value ||
      !tokenPriceMap[DISPLAY_BASE_TOKEN] ||
      tokenPriceMap[DISPLAY_BASE_TOKEN].isZero()
    ) {
      return null;
    }

    const value = collateralTokenValues.value.div(tokenPriceMap[DISPLAY_BASE_TOKEN]);

    return getTokenValues(value, tokenPriceMap[DISPLAY_BASE_TOKEN], DISPLAY_BASE_TOKEN);
  }, [collateralTokenValues.value, tokenPriceMap]);

  const collateralizationRatio = useMemo(() => {
    if (!collateralInDisplayToken?.value || !debtTokenValues.value) {
      return null;
    }

    if (debtTokenValues.value.isZero()) {
      return null;
    }

    return collateralInDisplayToken.value.div(debtTokenValues.value).mul(100);
  }, [collateralInDisplayToken?.value, debtTokenValues.value]);

  const collateralAmountFormatted = useMemo(
    () =>
      collateralInDisplayToken?.amount
        ? DecimalFormat.format(collateralInDisplayToken.amount, {
            style: 'decimal',
            fractionDigits: COLLATERAL_TOKEN_UI_PRECISION,
          })
        : null,
    [collateralInDisplayToken?.amount],
  );
  const collateralValueFormatted = useMemo(
    () =>
      collateralInDisplayToken?.value
        ? DecimalFormat.format(collateralInDisplayToken.value, {
            style: 'decimal',
            fractionDigits: USD_UI_PRECISION,
          })
        : null,
    [collateralInDisplayToken?.value],
  );
  const debtAmountFormatted = useMemo(
    () =>
      debtTokenValues.amount
        ? DecimalFormat.format(debtTokenValues.amount, {
            style: 'decimal',
            fractionDigits: R_TOKEN_UI_PRECISION,
          })
        : null,
    [debtTokenValues.amount],
  );
  const debtValueFormatted = useMemo(
    () =>
      debtTokenValues.value
        ? DecimalFormat.format(debtTokenValues.value, {
            style: 'decimal',
            fractionDigits: USD_UI_PRECISION,
          })
        : null,
    [debtTokenValues.value],
  );
  const collateralizationRatioFormatted = useMemo(
    () =>
      collateralizationRatio
        ? DecimalFormat.format(collateralizationRatio, {
            style: 'decimal',
            fractionDigits: USD_UI_PRECISION,
          })
        : null,
    [collateralizationRatio],
  );
  const collateralRatioLevel = useMemo(() => getCollateralRatioLevel(collateralizationRatio), [collateralizationRatio]);
  const collateralRatioLabel = useMemo(() => {
    switch (collateralRatioLevel) {
      case 'healthy':
        return 'Healthy';
      case 'at-risk':
        return 'At risk';
      case 'unhealthy':
        return 'Unhealthy';
      default:
        return null;
    }
  }, [collateralRatioLevel]);

  return (
    <div className="raft__your-position">
      <div className="raft__your-position__collateral">
        <Typography variant="overline">YOUR COLLATERAL</Typography>
        <div className="raft__your-position__collateral__amount">
          <TokenLogo type={`token-${DISPLAY_BASE_TOKEN}`} size="small" />
          <div className="raft__your-position__collateral__amount__number">
            <Typography variant="heading1">{collateralAmountFormatted ?? '---'}</Typography>
            <Typography variant="heading2">{DISPLAY_BASE_TOKEN}</Typography>
          </div>
        </div>
        <div className="raft__your-position__collateral__value__number">
          <Typography variant="caption">$</Typography>
          <Typography variant="body" weight="medium">
            {collateralValueFormatted ?? '---'}
          </Typography>
        </div>
      </div>
      <div className="raft__your-position__debt">
        <Typography variant="overline">YOUR DEBT</Typography>
        <div className="raft__your-position__debt__amount">
          <TokenLogo type={`token-${R_TOKEN}`} size="small" />
          <div className="raft__your-position__debt__amount__number">
            <Typography variant="heading1">{debtAmountFormatted ?? '---'}</Typography>
            <Typography variant="heading2">{R_TOKEN}</Typography>
          </div>
        </div>
        <div className="raft__your-position__debt__value__number">
          <Typography variant="caption">$</Typography>
          <Typography variant="body" weight="medium">
            {debtValueFormatted ?? '---'}
          </Typography>
        </div>
      </div>
      <div className="raft__your-position__ratio">
        <Typography variant="overline">COLLATERALIZATION</Typography>
        <div className="raft__your-position__ratio__percent">
          <Typography variant="heading1">{collateralizationRatioFormatted ?? '---'}</Typography>
          <Typography variant="heading2">%</Typography>
        </div>
        <div className="raft__your-position__ratio__status">
          <div className={`raft__your-position__ratio__status__color status-${collateralRatioLevel}`} />
          <Typography variant="body" weight="medium">
            {collateralRatioLabel ?? '---'}
          </Typography>
        </div>
      </div>
    </div>
  );
};

export default memo(YourPosition);
