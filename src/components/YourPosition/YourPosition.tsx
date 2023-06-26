import { R_TOKEN } from '@raft-fi/sdk';
import { FC, memo, useMemo } from 'react';
import { TokenLogo } from 'tempus-ui';
import { R_TOKEN_UI_PRECISION, SUPPORTED_COLLATERAL_TOKEN_SETTINGS, USD_UI_PRECISION } from '../../constants';
import { useCollateralConversionRates, usePosition, useTokenPrices } from '../../hooks';
import { Position, SupportedUnderlyingCollateralToken } from '../../interfaces';
import { formatDecimal, getCollateralRatioLevel, getDecimalFromTokenMap, getTokenValues } from '../../utils';
import { getCollateralRatioLabel } from '../../utils/collateralRatio';
import { Icon, Typography, ValueLabel } from '../shared';

import './YourPosition.scss';

const YourPosition: FC = () => {
  // already checked position and underlyingCollateralToken is not null to render this component
  const position = usePosition() as Position;
  const tokenPriceMap = useTokenPrices();
  const collateralConversionRateMap = useCollateralConversionRates();

  const underlyingCollateralToken = useMemo(
    () => position?.underlyingCollateralToken as SupportedUnderlyingCollateralToken,
    [position?.underlyingCollateralToken],
  );
  const displayBaseToken = useMemo(
    () => SUPPORTED_COLLATERAL_TOKEN_SETTINGS[underlyingCollateralToken].displayBaseToken,
    [underlyingCollateralToken],
  );
  const isRebasing = useMemo(
    () => SUPPORTED_COLLATERAL_TOKEN_SETTINGS[underlyingCollateralToken].isRebasing,
    [underlyingCollateralToken],
  );

  /**
   * Amount of collateral user has denominated in underlying token
   */
  const underlyingCollateralTokenValues = useMemo(
    () =>
      getTokenValues(position.collateralBalance, tokenPriceMap[underlyingCollateralToken], underlyingCollateralToken),
    [position, tokenPriceMap, underlyingCollateralToken],
  );

  const debtTokenValues = useMemo(
    () => getTokenValues(position.debtBalance, tokenPriceMap[R_TOKEN], R_TOKEN),
    [position, tokenPriceMap],
  );

  /**
   * Amount of collateral user has denominated in display base token
   */
  const displayCollateralTokenValues = useMemo(() => {
    const collateralConversionRate = getDecimalFromTokenMap(collateralConversionRateMap, displayBaseToken);

    if (!collateralConversionRate || !underlyingCollateralTokenValues.amount) {
      return null;
    }

    const value = underlyingCollateralTokenValues.amount.mul(collateralConversionRate);

    return getTokenValues(value, tokenPriceMap[displayBaseToken], displayBaseToken);
  }, [displayBaseToken, collateralConversionRateMap, underlyingCollateralTokenValues.amount, tokenPriceMap]);

  const collateralizationRatio = useMemo(() => {
    if (!underlyingCollateralTokenValues?.value || !debtTokenValues.value || debtTokenValues.value.isZero()) {
      return null;
    }

    return underlyingCollateralTokenValues.value.div(debtTokenValues.value);
  }, [underlyingCollateralTokenValues?.value, debtTokenValues.value]);

  const debtAmountFormatted = useMemo(
    () => formatDecimal(debtTokenValues.amount, R_TOKEN_UI_PRECISION),
    [debtTokenValues.amount],
  );
  const debtValueFormatted = useMemo(
    () => formatDecimal(debtTokenValues.value, USD_UI_PRECISION),
    [debtTokenValues.value],
  );
  const collateralizationRatioFormatted = useMemo(
    () => formatDecimal(collateralizationRatio?.mul(100) ?? null, USD_UI_PRECISION),
    [collateralizationRatio],
  );
  const collateralRatioLevel = useMemo(() => getCollateralRatioLevel(collateralizationRatio), [collateralizationRatio]);
  const collateralRatioLabel = useMemo(() => getCollateralRatioLabel(collateralizationRatio), [collateralizationRatio]);

  return (
    <div className="raft__your-position">
      <div className="raft__your-position__collateral">
        <Typography variant="overline">YOUR COLLATERAL</Typography>
        <div className="raft__your-position__collateral__amount">
          <TokenLogo type={`token-${displayBaseToken}`} size="small" />
          {displayCollateralTokenValues?.amountFormatted ? (
            <ValueLabel
              value={displayCollateralTokenValues.amountFormatted}
              valueSize="heading1"
              tickerSize="heading2"
            />
          ) : (
            '---'
          )}
          {isRebasing && <Icon variant="triangle-up" />}
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
