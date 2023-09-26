import { SupportedBridgeNetwork, SupportedSavingsNetwork } from '@raft-fi/sdk';

export const NETWORK_NAMES: Record<SupportedBridgeNetwork | SupportedSavingsNetwork, string> = {
  mainnet: 'Ethereum',
  base: 'Base',
  ethereumSepolia: 'Ethereum Sepolia',
  arbitrumGoerli: 'Arbitrum Goerli',
  goerli: 'Ethereum Goerli',
};

export const NETWORK_LOGO_VARIANTS: Record<SupportedBridgeNetwork | SupportedSavingsNetwork, string> = {
  mainnet: 'network-ethereum',
  base: 'network-base',
  ethereumSepolia: 'network-ethereum',
  arbitrumGoerli: 'network-arbitrum',
  goerli: 'network-ethereum',
};

export const NETWORK_IDS: Record<SupportedBridgeNetwork | SupportedSavingsNetwork, number> = {
  mainnet: 1,
  base: 8453,
  ethereumSepolia: 11155111,
  arbitrumGoerli: 421613,
  goerli: 5,
};

export const NETWORK_WALLET_ENDPOINTS: Record<SupportedBridgeNetwork | SupportedSavingsNetwork, string> = {
  mainnet: 'https://mainnet.infura.io/v3/',
  base: 'https://mainnet.base.org',
  ethereumSepolia: 'https://sepolia.infura.io/v3/',
  arbitrumGoerli: 'https://goerli-rollup.arbitrum.io/rpc',
  goerli: 'https://goerli.infura.io/v3/',
};

export const NETWORK_WALLET_CURRENCIES: Record<
  SupportedBridgeNetwork | SupportedSavingsNetwork,
  { symbol: string; decimals: number }
> = {
  mainnet: {
    symbol: 'ETH',
    decimals: 18,
  },
  base: {
    symbol: 'ETH',
    decimals: 18,
  },
  ethereumSepolia: {
    symbol: 'ETH',
    decimals: 18,
  },
  arbitrumGoerli: {
    symbol: 'AGOR',
    decimals: 18,
  },
  goerli: {
    symbol: 'GoerliETH',
    decimals: 18,
  },
};

export const BRIDGE_TESTNET_NETWORKS: SupportedBridgeNetwork[] = ['ethereumSepolia', 'arbitrumGoerli'];
export const BRIDGE_MAINNET_NETWORKS: SupportedBridgeNetwork[] = ['mainnet', 'base'];

export const SAVINGS_TESTNET_NETWORKS: SupportedSavingsNetwork[] = ['goerli'];
export const SAVINGS_MAINNET_NETWORKS: SupportedSavingsNetwork[] = ['mainnet', 'base'];
