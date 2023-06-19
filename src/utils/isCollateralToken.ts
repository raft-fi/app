import { COLLATERAL_TOKENS, CollateralToken, UNDERLYING_COLLATERAL_TOKENS } from '@raft-fi/sdk';
import { TOKEN_TO_DISPLAY_BASE_TOKEN_MAP } from '../constants';

export function isCollateralToken(value: string): value is CollateralToken {
  return COLLATERAL_TOKENS.includes(value as CollateralToken);
}

export function isUnderlyingCollateralToken(value: CollateralToken) {
  return (UNDERLYING_COLLATERAL_TOKENS as readonly CollateralToken[]).includes(value);
}

export function isDisplayBaseToken(value: CollateralToken) {
  return TOKEN_TO_DISPLAY_BASE_TOKEN_MAP[value] === value;
}
