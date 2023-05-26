import { MIN_COLLATERAL_RATIO } from '@raft-fi/sdk';
import { Decimal } from '@tempusfinance/decimal';
import { TypographyColor } from '../components/shared/Typography';
import { HEALTHY_RATIO } from '../constants';
import { Nullable } from '../interfaces';

type CollateralRatioLevel = 'healthy' | 'risk' | 'unhealthy';

export const getCollateralRatioLevel = (ratio: Nullable<Decimal>): Nullable<CollateralRatioLevel> => {
  if (!ratio) {
    return null;
  }

  if (ratio.gte(HEALTHY_RATIO)) {
    return 'healthy';
  }

  if (ratio.gt(MIN_COLLATERAL_RATIO)) {
    return 'risk';
  }

  return 'unhealthy';
};

// TODO: this should be removed soon
export const getCollateralRatioColor = (ratio: Nullable<Decimal>): TypographyColor | undefined => {
  const level = getCollateralRatioLevel(ratio);

  switch (level) {
    case 'healthy':
      return 'text-success';
    case 'risk':
      return 'text-warning';
    case 'unhealthy':
      return 'text-error';
    default:
      return undefined;
  }
};

export const getCollateralRatioLabel = (ratio: Nullable<Decimal>): Nullable<string> => {
  const level = getCollateralRatioLevel(ratio);

  switch (level) {
    case 'healthy':
      return 'Healthy';
    case 'risk':
      return 'At risk';
    case 'unhealthy':
      return 'Unhealthy';
    default:
      return null;
  }
};
