import { MIN_COLLATERAL_RATIO } from '@raft-fi/sdk';
import { Decimal } from '@tempusfinance/decimal';
import { HEALTHY_RATIO } from '../constants';
import { Nullable } from '../interfaces';

type CollateralRatioRiskLevel = 'low' | 'medium' | 'high';
type ProtocolCollateralRatioRiskLevel = 'low' | 'medium' | 'moderate' | 'high';

const PROTOCOL_HIGH_RISK_RATIO = MIN_COLLATERAL_RATIO;
const PROTOCOL_MEDIUM_RISK_RATIO = 1.5;
const PROTOCOL_MODERATE_RISK_RATIO = 1.8;

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

export const getProtocolCollateralRatioLevel = (
  ratio: Nullable<Decimal>,
): Nullable<ProtocolCollateralRatioRiskLevel> => {
  if (!ratio) {
    return null;
  }

  if (ratio.gte(PROTOCOL_MODERATE_RISK_RATIO)) {
    return 'low';
  }

  if (ratio.gt(PROTOCOL_MEDIUM_RISK_RATIO)) {
    return 'moderate';
  }

  if (ratio.gt(PROTOCOL_HIGH_RISK_RATIO)) {
    return 'medium';
  }

  return 'high';
};

export const getProtocolCollateralRatioLabel = (ratio: Nullable<Decimal>): Nullable<string> => {
  const level = getProtocolCollateralRatioLevel(ratio);

  switch (level) {
    case 'low':
      return 'Low Risk';
    case 'moderate':
      return 'Moderate Risk';
    case 'medium':
      return 'Medium Risk';
    case 'high':
      return 'High Risk';
    default:
      return null;
  }
};
