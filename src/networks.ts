import { SupportedBridgeNetworks } from '@raft-fi/sdk';

export const NETWORK_NAMES: Record<SupportedBridgeNetworks, string> = {
  ethereum: 'Ethereum',
  base: 'Base',
  ethereumSepolia: 'Ethereum Sepolia',
  arbitrumGoerli: 'Arbitrum Goerli',
};

export const NETWORK_LOGO_VARIANTS: Record<SupportedBridgeNetworks, string> = {
  ethereum: 'network-ethereum',
  base: 'network-base',
  ethereumSepolia: 'network-ethereum',
  arbitrumGoerli: 'network-arbitrum',
};
