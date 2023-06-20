import { R_TOKEN } from '@raft-fi/sdk';
import { DecimalFormat } from '@tempusfinance/decimal';
import { FC, memo, useMemo } from 'react';
import { TokenLogo } from 'tempus-ui';
import { R_TOKEN_UI_PRECISION, USD_UI_PRECISION } from '../../constants';
import { useCollateralBalance, useCollateralConversionRates, useDebtBalance, useTokenPrices } from '../../hooks';
import { getCollateralRatioLevel, getTokenValues } from '../../utils';
import { getCollateralRatioLabel } from '../../utils/collateralRatio';
import { Typography, ValueLabel } from '../shared';

import './YourPosition.scss';

const YourPosition: FC = () => {
  const collateralBalance = useCollateralBalance();
  const debtBalance = useDebtBalance();
  const tokenPriceMap = useTokenPrices();
  const collateralConversionRateMap = useCollateralConversionRates();

  /**
   * Amount of collateral user has denominated in underlying token (wstETH)
   */
  const underlyingCollateralTokenValues = useMemo(
    // TODO: fetch what token is in position to show corresponding underlying token
    () => getTokenValues(collateralBalance, tokenPriceMap['wstETH'], 'wstETH'),
    [collateralBalance, tokenPriceMap],
  );

  const debtTokenValues = useMemo(
    () => getTokenValues(debtBalance, tokenPriceMap[R_TOKEN], R_TOKEN),
    [debtBalance, tokenPriceMap],
  );

  /**
   * Amount of collateral user has denominated in display base token (stETH)
   */
  const displayCollateralTokenValues = useMemo(() => {
    // TODO: fetch what token is in position to show corresponding display token
    const collateralConversionRate = collateralConversionRateMap?.stETH;

    if (!collateralConversionRate || !underlyingCollateralTokenValues.amount) {
      return null;
    }

    const value = underlyingCollateralTokenValues.amount.mul(collateralConversionRate);

    // TODO: fetch what token is in position to show corresponding display token
    return getTokenValues(value, tokenPriceMap['stETH'], 'stETH');
  }, [collateralConversionRateMap, underlyingCollateralTokenValues.amount, tokenPriceMap]);

  const collateralizationRatio = useMemo(() => {
    if (!underlyingCollateralTokenValues?.value || !debtTokenValues.value) {
      return null;
    }

    if (debtTokenValues.value.isZero()) {
      return null;
    }

    return underlyingCollateralTokenValues.value.div(debtTokenValues.value);
  }, [underlyingCollateralTokenValues?.value, debtTokenValues.value]);

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
        ? DecimalFormat.format(collateralizationRatio.mul(100), {
            style: 'decimal',
            fractionDigits: USD_UI_PRECISION,
          })
        : null,
    [collateralizationRatio],
  );
  const collateralRatioLevel = useMemo(() => getCollateralRatioLevel(collateralizationRatio), [collateralizationRatio]);
  const collateralRatioLabel = useMemo(() => getCollateralRatioLabel(collateralizationRatio), [collateralizationRatio]);

  return (
    <div className="raft__your-position">
      <div className="raft__your-position__collateral">
        <Typography variant="overline">YOUR COLLATERAL</Typography>
        <div className="raft__your-position__collateral__amount">
          <TokenLogo type="token-stETH" size="small" />
          {displayCollateralTokenValues?.amountFormatted ? (
            <ValueLabel
              value={displayCollateralTokenValues.amountFormatted}
              valueSize="heading1"
              tickerSize="heading2"
            />
          ) : (
            '---'
          )}
        </div>
        <div className="raft__your-position__collateral__value__number">
          {underlyingCollateralTokenValues?.valueFormatted ? (
            <ValueLabel
              value={underlyingCollateralTokenValues.valueFormatted}
              valueSize="body"
              tickerSize="caption"
              color="text-secondary"
            />
          ) : (
            '---'
          )}
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
          <div className={`raft__your-position__ratio__status__color status-risk-${collateralRatioLevel}`} />
          <Typography variant="body" weight="medium">
            {collateralRatioLabel ?? '---'}
          </Typography>
        </div>
      </div>
    </div>
  );
};

export default memo(YourPosition);
