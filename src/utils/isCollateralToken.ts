import {
  SUPPORTED_COLLATERAL_TOKENS,
  SUPPORTED_UNDERLYING_TOKENS,
  TOKEN_TO_DISPLAY_BASE_TOKEN_MAP,
} from '../constants';
import { SupportedCollateralToken, SupportedUnderlyingCollateralToken } from '../interfaces';

export function isCollateralToken(value: string): value is SupportedCollateralToken {
  return SUPPORTED_COLLATERAL_TOKENS.includes(value as SupportedCollateralToken);
}

export function isUnderlyingCollateralToken(value: string) {
  return SUPPORTED_UNDERLYING_TOKENS.includes(value as SupportedUnderlyingCollateralToken);
}

export function isDisplayBaseToken(value: string) {
  return TOKEN_TO_DISPLAY_BASE_TOKEN_MAP[value as SupportedCollateralToken] === value;
}
