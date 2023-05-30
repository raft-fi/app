import { MIN_COLLATERAL_RATIO } from '@raft-fi/sdk';
import { Decimal } from '@tempusfinance/decimal';
import { HEALTHY_RATIO } from '../constants';
import { Nullable } from '../interfaces';

type CollateralRatioRiskLevel = 'low' | 'medium' | 'high';

export const getCollateralRatioLevel = (ratio: Nullable<Decimal>): Nullable<CollateralRatioRiskLevel> => {
  if (!ratio) {
    return null;
  }

  if (ratio.gte(HEALTHY_RATIO)) {
    return 'low';
  }

  if (ratio.gt(MIN_COLLATERAL_RATIO)) {
    return 'medium';
  }

  return 'high';
};

export const getCollateralRatioLabel = (ratio: Nullable<Decimal>): Nullable<string> => {
  const level = getCollateralRatioLevel(ratio);

  switch (level) {
    case 'low':
      return 'Low Risk';
    case 'medium':
      return 'Medium Risk';
    case 'high':
      return 'High Risk';
    default:
      return null;
  }
};
