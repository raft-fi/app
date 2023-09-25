import { SupportedBridgeNetwork, SupportedSavingsNetwork } from '@raft-fi/sdk';

export const NETWORK_NAMES: Record<SupportedBridgeNetwork, string> = {
  ethereum: 'Ethereum',
  base: 'Base',
  ethereumSepolia: 'Ethereum Sepolia',
  arbitrumGoerli: 'Arbitrum Goerli',
};

export const NETWORK_LOGO_VARIANTS: Record<SupportedBridgeNetwork, string> = {
  ethereum: 'network-ethereum',
  base: 'network-base',
  ethereumSepolia: 'network-ethereum',
  arbitrumGoerli: 'network-arbitrum',
};

export const NETWORK_IDS: Record<SupportedBridgeNetwork, number> = {
  ethereum: 1,
  base: 8453,
  ethereumSepolia: 11155111,
  arbitrumGoerli: 421613,
};

export const NETWORK_WALLET_ENDPOINTS: Record<SupportedBridgeNetwork, string> = {
  ethereum: 'https://mainnet.infura.io/v3/',
  base: 'https://mainnet.base.org',
  ethereumSepolia: 'https://sepolia.infura.io/v3/',
  arbitrumGoerli: 'https://goerli-rollup.arbitrum.io/rpc',
};

export const NETWORK_WALLET_CURRENCIES: Record<SupportedBridgeNetwork, { symbol: string; decimals: number }> = {
  ethereum: {
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
};

export const BRIDGE_TESTNET_NETWORKS: SupportedBridgeNetwork[] = ['ethereumSepolia', 'arbitrumGoerli'];
export const BRIDGE_MAINNET_NETWORKS: SupportedBridgeNetwork[] = ['ethereum', 'base'];

export const SAVINGS_TESTNET_NETWORKS: SupportedSavingsNetwork[] = ['ethereum-goerli'];
export const SAVINGS_MAINNET_NETWORKS: SupportedSavingsNetwork[] = ['ethereum', 'base'];
