import { MIN_COLLATERAL_RATIO } from '@raft-fi/sdk';
import { Decimal } from '@tempusfinance/decimal';
import { TypographyColor } from '../components/shared/Typography';
import { HEALTHY_RATIO } from '../constants';
import { Nullable } from '../interfaces';

type CollateralRatioLevel = 'healthy' | 'at-risk' | 'unhealthy';

export const getCollateralRatioLevel = (ratio: Nullable<Decimal>): Nullable<CollateralRatioLevel> => {
  if (!ratio) {
    return null;
  }

  if (ratio.gte(HEALTHY_RATIO)) {
    return 'healthy';
  }

  if (ratio.gt(MIN_COLLATERAL_RATIO)) {
    return 'at-risk';
  }

  return 'unhealthy';
};

// TODO: this should be removed soon
export const getCollateralRatioColor = (ratio: Nullable<Decimal>): TypographyColor | undefined => {
  const level = getCollateralRatioLevel(ratio);

  switch (level) {
    case 'healthy':
      return 'text-success';
    case 'at-risk':
      return 'text-warning';
    case 'unhealthy':
      return 'text-error';
    default:
      return undefined;
  }
};
