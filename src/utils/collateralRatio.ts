import { MIN_COLLATERAL_RATIO } from '@raft-fi/sdk';
import { Decimal } from '@tempusfinance/decimal';
import { TypographyColor } from '../components/shared/Typography';
import { HEALTHY_RATIO } from '../constants';
import { Nullable } from '../interfaces';

type CollateralRatioLevel = 'healthy' | 'medium' | 'dangerous';

export const getCollateralRatioLevel = (ratio: Nullable<Decimal>): Nullable<CollateralRatioLevel> => {
  if (!ratio) {
    return null;
  }

  if (ratio.gte(HEALTHY_RATIO)) {
    return 'healthy';
  }

  if (ratio.gt(MIN_COLLATERAL_RATIO)) {
    return 'medium';
  }

  return 'dangerous';
};

export const getCollateralRatioColor = (ratio: Nullable<Decimal>): TypographyColor | undefined => {
  const level = getCollateralRatioLevel(ratio);

  switch (level) {
    case 'healthy':
      return 'text-success';
    case 'medium':
      return 'text-warning';
    case 'dangerous':
      return 'text-error';
    default:
      return undefined;
  }
};
