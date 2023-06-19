import { CollateralToken, Token, TOKENS, UnderlyingCollateralToken } from '@raft-fi/sdk';
import { StrictPartial } from './interfaces';

export const TWITTER_URL = 'https://twitter.com/raft_fi';
export const DISCORD_INVITE_URL = 'https://discord.com/invite/raft-fi';
export const GITHUB_URL = 'https://github.com/raft-fi';
export const GITBOOK_URL = 'https://docs.raft.fi/';
export const DEBOUNCE_IN_MS = 500;
export const POLLING_INTERVAL_IN_MS = 2 * 60 * 1000;
export const NUMBER_OF_CONFIRMATIONS_FOR_TX = 1;
export const MIN_BORROW_AMOUNT = 3000;
export const HEALTHY_RATIO = 2.2;
export const HEALTHY_RATIO_BUFFER = 0.00001;
export const LIQUIDATION_LOWER_RATIO = 1;
export const COLLATERAL_TOKEN_UI_PRECISION = 4;
export const R_TOKEN_UI_PRECISION = 2;
export const R_PRICE_UI_PRECISION = 4;
export const USD_UI_PRECISION = 2;
export const MULTIPLIER_UI_PRECISION = 2;
export const ZERO_ADDRESS = '0x0';
export const INPUT_PREVIEW_DIGITS = 4;
export const MINIMUM_UI_AMOUNT_FOR_BORROW_FEE = 0.01;

// app to control what is supported
export const SUPPORTED_COLLATERAL_TOKENS: StrictPartial<CollateralToken>[] = ['stETH', 'wstETH'];
export const SUPPORTED_TOKENS: StrictPartial<Token>[] = ['R', 'stETH', 'wstETH'];
export const SUPPORTED_COLLATERAL_TOKEN_SETTINGS: Record<
  UnderlyingCollateralToken,
  {
    tokens: Token[];
    displayBaseToken: Token;
    underlyingToken: UnderlyingCollateralToken;
  }
> = {
  wstETH: {
    tokens: ['stETH', 'wstETH'] as Token[],
    displayBaseToken: 'stETH',
    underlyingToken: 'wstETH',
  },
};
export const SUPPORTED_UNDERLYING_TOKENS = Object.keys(
  SUPPORTED_COLLATERAL_TOKEN_SETTINGS,
) as UnderlyingCollateralToken[];
// token to underlying token map
export const TOKEN_TO_UNDERLYING_TOKEN_MAP: {
  [token: string]: UnderlyingCollateralToken;
} = SUPPORTED_COLLATERAL_TOKENS.reduce((map, token) => {
  const setting = Object.values(SUPPORTED_COLLATERAL_TOKEN_SETTINGS).find(setting => setting.tokens.includes(token));
  return setting ? { ...map, [token]: setting.underlyingToken } : map;
}, {} as Record<Token, UnderlyingCollateralToken>);
// token to display base token map
export const TOKEN_TO_DISPLAY_BASE_TOKEN_MAP = SUPPORTED_COLLATERAL_TOKENS.reduce((map, token) => {
  const setting = Object.values(SUPPORTED_COLLATERAL_TOKEN_SETTINGS).find(setting => setting.tokens.includes(token));
  return setting ? { ...map, [token]: setting.displayBaseToken } : map;
}, {} as Record<Token, Token>);

export const DEFAULT_MAP = TOKENS.reduce(
  (map, token) => ({
    ...map,
    [token]: null,
  }),
  {},
);
