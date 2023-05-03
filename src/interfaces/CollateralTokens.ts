export const DISPLAY_BASE_TOKEN = 'stETH';
export const COLLATERAL_TOKENS = ['ETH', DISPLAY_BASE_TOKEN, 'wstETH'] as const;

export type CollateralToken = (typeof COLLATERAL_TOKENS)[number];

export function isCollateralToken(value: string): value is CollateralToken {
  return COLLATERAL_TOKENS.includes(value as CollateralToken);
}
