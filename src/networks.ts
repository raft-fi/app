import { SupportedBridgeNetwork } from '@raft-fi/sdk';

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

export const TESTNET_NETWORKS: SupportedBridgeNetwork[] = ['ethereumSepolia', 'arbitrumGoerli'];
export const MAINNET_NETWORKS: SupportedBridgeNetwork[] = ['ethereum', 'base'];
