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
import { getCollateralRatioColor, getTokenValues } from '../../utils';
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
  const collateralRatioColor = useMemo(() => getCollateralRatioColor(collateralizationRatio), [collateralizationRatio]);
  const collateralRatioLabel = useMemo(() => {
    switch (collateralRatioColor) {
      case 'text-success':
        return 'Healthy';
      case 'text-warning':
        return 'Unhealthy';
      case 'text-error':
        return 'Dangerous';
      default:
        return null;
    }
  }, [collateralRatioColor]);

  return (
    <div className="raft__your-position">
      <div className="raft__your-position__collateral">
        <Typography variant="body-tertiary" weight="semi-bold" color="text-accent">
          YOUR COLLATERAL
        </Typography>
        <div className="raft__your-position__collateral__amount">
          <TokenLogo type={`token-${DISPLAY_BASE_TOKEN}`} size="small" />
          <div className="raft__your-position__collateral__amount__number">
            <Typography variant="title" weight="medium">
              {collateralAmountFormatted ?? '---'}
            </Typography>
            <Typography variant="subtitle" weight="medium">
              {DISPLAY_BASE_TOKEN}
            </Typography>
          </div>
        </div>
        <div className="raft__your-position__collateral__value__number">
          <Typography variant="body-tertiary" color="text-secondary">
            $
          </Typography>
          <Typography variant="body-primary" weight="medium" color="text-secondary">
            {collateralValueFormatted ?? '---'}
          </Typography>
        </div>
      </div>
      <div className="raft__your-position__debt">
        <Typography variant="body-tertiary" weight="semi-bold" color="text-accent">
          YOUR DEBT
        </Typography>
        <div className="raft__your-position__debt__amount">
          <TokenLogo type={`token-${R_TOKEN}`} size="small" />
          <div className="raft__your-position__debt__amount__number">
            <Typography variant="title" weight="medium">
              {debtAmountFormatted ?? '---'}
            </Typography>
            <Typography variant="subtitle" weight="medium" type="mono">
              {R_TOKEN}
            </Typography>
          </div>
        </div>
        <div className="raft__your-position__debt__value__number">
          <Typography variant="body-tertiary" color="text-secondary">
            $
          </Typography>
          <Typography variant="body-primary" weight="medium" color="text-secondary">
            {debtValueFormatted ?? '---'}
          </Typography>
        </div>
      </div>
      <div className="raft__your-position__ratio">
        <Typography variant="body-tertiary" weight="semi-bold" color="text-accent">
          COLLATERALIZATION
        </Typography>
        <div className="raft__your-position__ratio__percent">
          <Typography variant="title" weight="medium">
            {collateralizationRatioFormatted ?? '---'}
          </Typography>
          <Typography variant="subtitle" weight="medium">
            %
          </Typography>
        </div>
        <div className="raft__your-position__ratio__status">
          <div className={`raft__your-position__ratio__status__color ${collateralRatioColor}`} />
          <Typography variant="body-primary" weight="medium" color="text-secondary">
            {collateralRatioLabel ?? '---'}
          </Typography>
        </div>
      </div>
    </div>
  );
};

export default memo(YourPosition);
