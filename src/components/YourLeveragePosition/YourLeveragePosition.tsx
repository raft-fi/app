import { MIN_COLLATERAL_RATIO, R_TOKEN } from '@raft-fi/sdk';
import { Decimal } from '@tempusfinance/decimal';
import { FC, memo, useMemo } from 'react';
import { TokenLogo } from 'tempus-ui';
import { SUPPORTED_COLLATERAL_TOKEN_SETTINGS, USD_UI_PRECISION } from '../../constants';
import { useCollateralConversionRates, useCollateralTokenAprs, useTokenPrices } from '../../hooks';
import { LeveragePosition, SupportedUnderlyingCollateralToken } from '../../interfaces';
import { formatDecimal, formatPercentage, getDecimalFromTokenMap, getTokenValues } from '../../utils';
import { Icon, Typography, ValueLabel } from '../shared';

import './YourLeveragePosition.scss';

interface YourLeveragePositionProps {
  position: LeveragePosition;
}

const YourLeveragePosition: FC<YourLeveragePositionProps> = ({ position }) => {
  const tokenPriceMap = useTokenPrices();
  const collateralConversionRateMap = useCollateralConversionRates();
  const collateralTokenAprMap = useCollateralTokenAprs();

  // already checked underlyingCollateralToken is not null to render this component
  const underlyingCollateralToken = position.underlyingCollateralToken as SupportedUnderlyingCollateralToken;
  const displayBaseToken = SUPPORTED_COLLATERAL_TOKEN_SETTINGS[underlyingCollateralToken].displayBaseToken;
  const isRebasing = SUPPORTED_COLLATERAL_TOKEN_SETTINGS[underlyingCollateralToken].isRebasing;

  const principalUnderlyingCollateralTokenValues = useMemo(
    () =>
      getTokenValues(
        position.principalCollateralBalance,
        tokenPriceMap[underlyingCollateralToken],
        underlyingCollateralToken,
      ),
    [position, tokenPriceMap, underlyingCollateralToken],
  );

  const debtTokenValues = useMemo(
    () => getTokenValues(position.debtBalance, tokenPriceMap[R_TOKEN], R_TOKEN),
    [position, tokenPriceMap],
  );
  const displayPrincipalCollateralTokenValues = useMemo(() => {
    const collateralConversionRate = getDecimalFromTokenMap(collateralConversionRateMap, displayBaseToken);

    if (!collateralConversionRate || !principalUnderlyingCollateralTokenValues.amount) {
      return null;
    }

    const value = principalUnderlyingCollateralTokenValues.amount.mul(collateralConversionRate);

    return getTokenValues(value, tokenPriceMap[displayBaseToken], displayBaseToken);
  }, [displayBaseToken, collateralConversionRateMap, principalUnderlyingCollateralTokenValues.amount, tokenPriceMap]);

  const displayTokenPrice = useMemo(
    () => getDecimalFromTokenMap(tokenPriceMap, displayBaseToken),
    [displayBaseToken, tokenPriceMap],
  );
  const collateralTokenLeveragedApr = useMemo(() => {
    const apr = getDecimalFromTokenMap(collateralTokenAprMap, displayBaseToken);

    if (!apr) {
      return null;
    }

    return apr.mul(position.effectiveLeverage);
  }, [collateralTokenAprMap, displayBaseToken, position.effectiveLeverage]);
  const collateralizationRatio = useMemo(() => {
    if (!displayTokenPrice || !debtTokenValues.value || debtTokenValues.value.isZero()) {
      return null;
    }

    const collateralValues = position.collateralBalance.mul(displayTokenPrice);

    if (!collateralValues) {
      return null;
    }

    return collateralValues.div(debtTokenValues.value);
  }, [displayTokenPrice, debtTokenValues.value, position.collateralBalance]);
  const liquidationPrice = useMemo(() => {
    if (!displayTokenPrice || !collateralizationRatio) {
      return null;
    }

    return displayTokenPrice.div(collateralizationRatio).mul(MIN_COLLATERAL_RATIO[underlyingCollateralToken]);
  }, [collateralizationRatio, displayTokenPrice, underlyingCollateralToken]);
  const liquidationPriceDropPercent = useMemo(
    () =>
      displayTokenPrice && liquidationPrice && !displayTokenPrice.isZero()
        ? Decimal.ONE.sub(liquidationPrice.div(displayTokenPrice))
        : null,
    [displayTokenPrice, liquidationPrice],
  );

  const collateralTokenLeveragedAprFormatted = useMemo(
    () => formatPercentage(collateralTokenLeveragedApr),
    [collateralTokenLeveragedApr],
  );
  const liquidationPriceFormatted = useMemo(
    () => formatDecimal(liquidationPrice, USD_UI_PRECISION),
    [liquidationPrice],
  );
  const liquidationPriceChangeFormatted = useMemo(
    () => formatPercentage(liquidationPriceDropPercent),
    [liquidationPriceDropPercent],
  );

  return (
    <div className="raft__your-leverage-position">
      <div className="raft__your-leverage-position__collateral">
        <Typography variant="overline">NET BALANCE</Typography>
        <div className="raft__your-leverage-position__collateral__amount">
          <TokenLogo type={`token-${displayBaseToken}`} size="small" />
          {displayPrincipalCollateralTokenValues?.amountFormatted ? (
            <ValueLabel
              value={displayPrincipalCollateralTokenValues.amountFormatted}
              valueSize="heading1"
              tickerSize="heading2"
            />
          ) : (
            '---'
          )}
          {isRebasing && <Icon variant="triangle-up" />}
        </div>
        <div className="raft__your-leverage-position__collateral__value__number">
          {principalUnderlyingCollateralTokenValues?.valueFormatted ? (
            <ValueLabel
              value={principalUnderlyingCollateralTokenValues.valueFormatted}
              valueSize="body"
              tickerSize="caption"
              color="text-secondary"
            />
          ) : (
            '---'
          )}
        </div>
      </div>
      <div className="raft__your-leverage-position__leverage">
        <Typography variant="overline">LEVERAGE</Typography>
        <div className="raft__your-leverage-position__leverage__amount">
          <div className="raft__your-leverage-position__leverage__amount__number">
            <Typography variant="heading1">{position.effectiveLeverage.toRounded(1)}x</Typography>
          </div>
        </div>
        <div className="raft__your-leverage-position__leverage__value__number">
          <Typography variant="body" weight="medium">
            {collateralTokenLeveragedAprFormatted ?? '---'} APR
          </Typography>
        </div>
      </div>
      <div className="raft__your-leverage-position__liquidation">
        <Typography variant="overline">LIQUIDATION PRICE</Typography>
        <div className="raft__your-leverage-position__liquidation__price">
          <Typography variant="heading2">$</Typography>
          <Typography variant="heading1" weight="medium">
            {liquidationPriceFormatted ?? '---'}
          </Typography>
        </div>
        <div className="raft__your-leverage-position__liquidation__desc">
          <Typography variant="body" weight="medium">
            {liquidationPriceChangeFormatted ?? '---'} below current price
          </Typography>
        </div>
      </div>
    </div>
  );
};

export default memo(YourLeveragePosition);
