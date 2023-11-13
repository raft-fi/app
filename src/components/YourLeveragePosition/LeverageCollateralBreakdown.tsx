import { memo, useMemo } from 'react';
import { TokenLogo } from '@tempusfinance/common-ui';
import {
  COLLATERAL_TOKEN_UI_PRECISION,
  R_TOKEN_UI_PRECISION,
  SUPPORTED_COLLATERAL_TOKEN_SETTINGS,
  USD_UI_PRECISION,
} from '../../constants';
import { useCollateralConversionRates, usePosition, useTokenPrices } from '../../hooks';
import { formatDecimal } from '../../utils';
import { Tooltip, Typography } from '../shared';

const LeverageCollateralBreakdown = () => {
  const tokenPriceMap = useTokenPrices();
  const position = usePosition();
  const collateralConversionRateMap = useCollateralConversionRates();

  const collateralAmountFormatted = useMemo(() => {
    if (!position?.collateralBalance || !position?.underlyingCollateralToken) {
      return null;
    }

    const displayToken = SUPPORTED_COLLATERAL_TOKEN_SETTINGS[position.underlyingCollateralToken].displayBaseToken;
    const rate = collateralConversionRateMap[displayToken];

    if (!rate) {
      return null;
    }

    return formatDecimal(position.collateralBalance.mul(rate), COLLATERAL_TOKEN_UI_PRECISION);
  }, [collateralConversionRateMap, position?.collateralBalance, position?.underlyingCollateralToken]);

  const collateralValueFormatted = useMemo(() => {
    if (!position?.collateralBalance || !position?.underlyingCollateralToken) {
      return null;
    }

    const tokenPrice = tokenPriceMap[position.underlyingCollateralToken];

    if (!tokenPrice) {
      return null;
    }

    return formatDecimal(position.collateralBalance.mul(tokenPrice), USD_UI_PRECISION);
  }, [position?.collateralBalance, position?.underlyingCollateralToken, tokenPriceMap]);

  const debtAmountFormatted = useMemo(() => {
    if (!position?.debtBalance) {
      return null;
    }

    return formatDecimal(position.debtBalance, R_TOKEN_UI_PRECISION);
  }, [position?.debtBalance]);

  const debtValueFormatted = useMemo(() => {
    if (!position?.debtBalance) {
      return null;
    }

    return formatDecimal(position.debtBalance, USD_UI_PRECISION);
  }, [position?.debtBalance]);

  const netBalanceFormatted = useMemo(() => {
    if (!position?.netBalance || !position?.underlyingCollateralToken) {
      return null;
    }

    const displayToken = SUPPORTED_COLLATERAL_TOKEN_SETTINGS[position.underlyingCollateralToken].displayBaseToken;
    const rate = collateralConversionRateMap[displayToken];

    if (!rate) {
      return null;
    }

    return formatDecimal(position.netBalance.mul(rate), COLLATERAL_TOKEN_UI_PRECISION);
  }, [collateralConversionRateMap, position?.netBalance, position?.underlyingCollateralToken]);

  const netBalanceValueFormatted = useMemo(() => {
    if (!position?.netBalance || !position?.underlyingCollateralToken) {
      return null;
    }

    const tokenPrice = tokenPriceMap[position.underlyingCollateralToken];

    if (!tokenPrice) {
      return null;
    }

    return formatDecimal(position.netBalance.mul(tokenPrice), USD_UI_PRECISION);
  }, [position?.netBalance, position?.underlyingCollateralToken, tokenPriceMap]);

  if (!position?.underlyingCollateralToken) {
    return null;
  }

  return (
    <Tooltip className="raft__protocol-stats__collateral-breakdown">
      <ul>
        {/* Collateral */}
        <li>
          <TokenLogo type="token-stETH" size="small" />
          <Typography
            className="raft__protocol-stats__collateral-breakdown__token-name"
            variant="overline"
            weight="semi-bold"
          >
            COLLATERAL
          </Typography>
          <div className="raft__protocol-stats__collateral-breakdown__token-values">
            <div className="raft__protocol-stats__collateral-breakdown__token-amount">
              <Typography variant="body" weight="medium">
                {collateralAmountFormatted ?? '---'}&nbsp;
              </Typography>
              <Typography variant="caption">
                {SUPPORTED_COLLATERAL_TOKEN_SETTINGS[position.underlyingCollateralToken].displayBaseToken}
              </Typography>
            </div>
            <div className="raft__protocol-stats__collateral-breakdown__token-value">
              <Typography variant="caption" color="text-secondary">
                $
              </Typography>
              <Typography variant="body2" weight="medium" color="text-secondary">
                {collateralValueFormatted ?? '---'}
              </Typography>
            </div>
          </div>
        </li>

        {/* Debt */}
        <li>
          <TokenLogo type="token-R" size="small" />
          <Typography
            className="raft__protocol-stats__collateral-breakdown__token-name"
            variant="overline"
            weight="semi-bold"
          >
            DEBT
          </Typography>
          <div className="raft__protocol-stats__collateral-breakdown__token-values">
            <div className="raft__protocol-stats__collateral-breakdown__token-amount">
              <Typography variant="body" weight="medium">
                {debtAmountFormatted ?? '---'}&nbsp;
              </Typography>
              <Typography variant="caption">R</Typography>
            </div>
            <div className="raft__protocol-stats__collateral-breakdown__token-value">
              <Typography variant="caption" color="text-secondary">
                $
              </Typography>
              <Typography variant="body2" weight="medium" color="text-secondary">
                {debtValueFormatted ?? '---'}
              </Typography>
            </div>
          </div>
        </li>

        {/* Net balance */}
        <li>
          <TokenLogo type="token-stETH" size="small" />
          <Typography
            className="raft__protocol-stats__collateral-breakdown__token-name"
            variant="overline"
            weight="semi-bold"
          >
            NET BALANCE
          </Typography>
          <div className="raft__protocol-stats__collateral-breakdown__token-values">
            <div className="raft__protocol-stats__collateral-breakdown__token-amount">
              <Typography variant="body2" weight="medium">
                {netBalanceFormatted ?? '---'}&nbsp;
              </Typography>
              <Typography variant="caption">
                {SUPPORTED_COLLATERAL_TOKEN_SETTINGS[position.underlyingCollateralToken].displayBaseToken}
              </Typography>
            </div>
            <div className="raft__protocol-stats__collateral-breakdown__token-value">
              <Typography variant="caption" color="text-secondary">
                $
              </Typography>
              <Typography variant="body2" weight="medium" color="text-secondary">
                {netBalanceValueFormatted ?? '---'}
              </Typography>
            </div>
          </div>
        </li>
      </ul>
    </Tooltip>
  );
};

export default memo(LeverageCollateralBreakdown);
