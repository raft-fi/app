const COLLATERAL_TOKENS = ['ETH', 'stETH', 'wstETH'] as const;

export type CollateralToken = (typeof COLLATERAL_TOKENS)[number];

export function isCollateralToken(value: string): value is CollateralToken {
  return COLLATERAL_TOKENS.includes(value as CollateralToken);
}
