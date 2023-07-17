import { Decimal } from '@tempusfinance/decimal';
import { HEALTHY_RATIO } from '../constants';
import { Nullable } from '../interfaces';

type CollateralRatioRiskLevel = 'low' | 'medium' | 'high';
type ProtocolCollateralRatioRiskLevel = 'low' | 'medium' | 'moderate' | 'high' | 'critical';

const PROTOCOL_CRITICAL_RISK_RATIO = 1.2;
const PROTOCOL_HIGH_RISK_RATIO = 1.4;
const PROTOCOL_MEDIUM_RISK_RATIO = 1.6;
const PROTOCOL_MODERATE_RISK_RATIO = 2;

const USER_HIGH_RISK_RATIO = 1.3;

export const getCollateralRatioLevel = (ratio: Nullable<Decimal>): Nullable<CollateralRatioRiskLevel> => {
  if (!ratio) {
    return null;
  }

  if (ratio.gte(HEALTHY_RATIO)) {
    return 'low';
  }

  if (ratio.gt(USER_HIGH_RISK_RATIO)) {
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

  if (ratio.gt(PROTOCOL_CRITICAL_RISK_RATIO)) {
    return 'high';
  }

  return 'critical';
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
    case 'critical':
      return 'Critical Risk';
    default:
      return null;
  }
};
