import { CollateralToken, SupportedBridgeNetwork, Token, UnderlyingCollateralToken } from '@raft-fi/sdk';
import { Decimal } from '@tempusfinance/decimal';
import {
  SupportedCollateralToken,
  SupportedSwapToken,
  SupportedUnderlyingCollateralToken,
  TokenGenericMap,
} from './interfaces';

export const RAFT_HOMEPAGE_URL = 'https://raft.fi';
export const TWITTER_URL = 'https://twitter.com/raft_fi';
export const DISCORD_INVITE_URL = 'https://discord.com/invite/raft-fi';
export const GITHUB_URL = 'https://github.com/raft-fi';
export const GITBOOK_URL = 'https://docs.raft.fi/';
export const CCIP_EXPLORER_URL = 'https://ccip.chain.link/';
export const DEBOUNCE_IN_MS = 500;
export const POLLING_INTERVAL_IN_MS = 2 * 60 * 1000;
export const NUMBER_OF_CONFIRMATIONS_FOR_TX = 1;
export const MIN_BORROW_AMOUNT = 3000;
export const HEALTHY_RATIO = 2.2;
export const HEALTHY_RATIO_BUFFER = 0.00001;
export const COLLATERAL_TOKEN_UI_PRECISION = 4;
export const R_TOKEN_UI_PRECISION = 2;
export const R_PRICE_UI_PRECISION = 4;
export const USD_UI_PRECISION = 2;
export const MULTIPLIER_UI_PRECISION = 2;
export const ZERO_ADDRESS = '0x0';
export const INPUT_PREVIEW_DIGITS = 4;
export const MINIMUM_UI_AMOUNT_FOR_BORROW_FEE = 0.01;
export const DEFAULT_SLIPPAGE = 0.005;
export const GAS_LIMIT_MULTIPLIER = new Decimal(1.3);
export const SAVING_POSITION_BALANCE_THRESHOLD = 0.001;

// app to control what is supported
export const SUPPORTED_UNDERLYING_TOKENS = [
  // v1 vaults
  'wstETH-v1',
  'wcrETH-v1',

  // v2 vaults
  'wstETH',
  'WETH',
  'rETH',
  'cbETH',
  'swETH',
  'WBTC',
] as const satisfies ReadonlyArray<UnderlyingCollateralToken>;
export const SUPPORTED_COLLATERAL_TOKENS = [
  // v1 vaults
  'stETH',
  'wstETH-v1',
  'rETH-v1',
  'wcrETH-v1',

  // v2 vaults
  'wstETH',
  'WETH',
  'rETH',
  'cbETH',
  'swETH',
  'WBTC',
] as const satisfies ReadonlyArray<CollateralToken>;
export const SUPPORTED_SWAP_TOKENS = ['wstETH', 'rETH', 'R'] as const satisfies ReadonlyArray<Token>;
export const SUPPORTED_TOKENS = [
  'R',
  'wstETH-v1',
  'wcrETH-v1',
  'wstETH',
  'WETH',
  'stETH',
  'rETH',
  'rETH-v1',
  'cbETH',
  'swETH',
  'WBTC',
] as const satisfies ReadonlyArray<Token>;

export const SUPPORTED_COLLATERAL_TOKEN_SETTINGS: Record<
  SupportedUnderlyingCollateralToken,
  {
    tokens: SupportedCollateralToken[];
    displayBaseToken: SupportedCollateralToken;
    underlyingToken: SupportedUnderlyingCollateralToken;
    swapToken: SupportedSwapToken;
    isRebasing: boolean;
  }
> = {
  wstETH: {
    tokens: ['wstETH'] as SupportedCollateralToken[],
    displayBaseToken: 'wstETH',
    underlyingToken: 'wstETH',
    swapToken: 'wstETH',
    isRebasing: false,
  },
  'wstETH-v1': {
    tokens: ['stETH', 'wstETH-v1'] as SupportedCollateralToken[],
    displayBaseToken: 'stETH',
    underlyingToken: 'wstETH-v1',
    swapToken: 'wstETH',
    isRebasing: true,
  },
  'wcrETH-v1': {
    tokens: ['rETH-v1'] as SupportedCollateralToken[],
    displayBaseToken: 'rETH',
    underlyingToken: 'wcrETH-v1',
    swapToken: 'rETH',
    isRebasing: false,
  },
  WETH: {
    tokens: ['WETH'] as SupportedCollateralToken[],
    displayBaseToken: 'WETH',
    underlyingToken: 'WETH',
    swapToken: 'wstETH', // TODO - Update to correct swap token once we add leverage support for v2 vaults
    isRebasing: false,
  },
  rETH: {
    tokens: ['rETH'] as SupportedCollateralToken[],
    displayBaseToken: 'rETH',
    underlyingToken: 'rETH',
    swapToken: 'rETH', // TODO - Update to correct swap token once we add leverage support for v2 vaults
    isRebasing: false,
  },
  cbETH: {
    tokens: ['cbETH'] as SupportedCollateralToken[],
    displayBaseToken: 'cbETH',
    underlyingToken: 'cbETH',
    swapToken: 'rETH', // TODO - Update to correct swap token once we add leverage support for v2 vaults
    isRebasing: false,
  },
  swETH: {
    tokens: ['swETH'] as SupportedCollateralToken[],
    displayBaseToken: 'swETH',
    underlyingToken: 'swETH',
    swapToken: 'rETH', // TODO - Update to correct swap token once we add leverage support for v2 vaults
    isRebasing: false,
  },
  WBTC: {
    tokens: ['WBTC'] as SupportedCollateralToken[],
    displayBaseToken: 'WBTC',
    underlyingToken: 'WBTC',
    swapToken: 'rETH', // TODO - Update to correct swap token once we add leverage support for v2 vaults
    isRebasing: false,
  },
};
// token to underlying token map
export const TOKEN_TO_UNDERLYING_TOKEN_MAP: {
  [token in SupportedCollateralToken]: SupportedUnderlyingCollateralToken;
} = {
  // v1 vaults
  stETH: 'wstETH-v1',
  'wstETH-v1': 'wstETH-v1',
  'rETH-v1': 'wcrETH-v1',
  'wcrETH-v1': 'wcrETH-v1',

  // v2 vaults
  wstETH: 'wstETH',
  WETH: 'WETH',
  rETH: 'rETH',
  cbETH: 'cbETH',
  swETH: 'swETH',
  WBTC: 'WBTC',
};
// token to display base token map
export const TOKEN_TO_DISPLAY_BASE_TOKEN_MAP = SUPPORTED_COLLATERAL_TOKENS.reduce((map, token) => {
  const setting = Object.values(SUPPORTED_COLLATERAL_TOKEN_SETTINGS).find(setting => setting.tokens.includes(token));
  return setting ? { ...map, [token]: setting.displayBaseToken } : map;
}, {} as TokenGenericMap<SupportedCollateralToken, SupportedCollateralToken>);

export const NETWORK_RPC_URLS: Record<SupportedBridgeNetwork, string> = {
  ethereum: import.meta.env.VITE_MAINNET_RPC_URL,
  base: import.meta.env.VITE_BASE_MAINNET_RPC_URL,
  ethereumSepolia: import.meta.env.VITE_ETHEREUM_SEPOLIA_RPC_URL,
  arbitrumGoerli: import.meta.env.VITE_ARBITRUM_GOERLI_RPC_URL,
};

export const MANAGE_POSITION_V1_TOKENS: SupportedCollateralToken[] = ['stETH', 'wstETH-v1', 'rETH'];
export const MANAGE_POSITION_V2_TOKENS: SupportedCollateralToken[] = [
  'wstETH',
  'WETH',
  'rETH',
  'cbETH',
  'swETH',
  'WBTC',
];

export const PRETTIFY_TOKEN_NAME_MAP: { [token in SupportedCollateralToken]: string } = {
  stETH: 'stETH',
  'wstETH-v1': 'wstETH',
  rETH: 'rETH',
  'wcrETH-v1': 'wcrETH',
  WETH: 'WETH',
  wstETH: 'wstETH',
  'rETH-v1': 'rETH',
  cbETH: 'cbETH',
  swETH: 'swETH',
  WBTC: 'WBTC',
};
