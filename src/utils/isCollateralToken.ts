import { COLLATERAL_TOKENS, CollateralToken } from '@raft-fi/sdk';

export function isCollateralToken(value: string): value is CollateralToken {
  return COLLATERAL_TOKENS.includes(value as CollateralToken);
}
