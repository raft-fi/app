import { RaftConfig, SupportedNetwork } from '@raft-fi/sdk';
import { Config } from '../interfaces';

const FALLBACK_NETWORK: SupportedNetwork = 'goerli';
export const NETWORK: SupportedNetwork = import.meta.env.VITE_NETWORK ?? FALLBACK_NETWORK;

RaftConfig.setNetwork(NETWORK);
RaftConfig.setEndpointOptions({
  subgraphEndpoint: import.meta.env.VITE_SUBGRAPH_URL,
  balancerSubgraphEndpoint: import.meta.env.VITE_BALANCER_SUBGRAPH_URL,
  oneInchEndpoint: import.meta.env.VITE_1INCH_API_URL,
  oneInchApiKey: import.meta.env.VITE_1INCH_API_KEY,
});

const config: Config = {
  mainnet: {
    publicNetworkUrl: '',
    privateNetworkUrl: '',
    networkName: 'Ethereum mainnet',
    alchemyKey: '',
    chainId: 1,
    /**
     * Average block time on chain in seconds.
     */
    averageBlockTime: 1,
    nativeToken: 'ETH',
    nativeTokenPrecision: 18,
    blockExplorerName: 'Etherscan',
    blockExplorerUrl: 'https://etherscan.io',
    rpcUrl: import.meta.env.VITE_MAINNET_RPC_URL,
    managePositionTokensV1: ['stETH', 'wstETH-v1', 'rETH'],
    managePositionTokensV2: ['wstETH', 'WETH', 'rETH', 'cbETH', 'swETH', 'WBTC'],
  },
  goerli: {
    publicNetworkUrl: '',
    privateNetworkUrl: '',
    networkName: 'Goerli testnet',
    alchemyKey: '',
    chainId: 5,
    /**
     * Average block time on chain in seconds.
     */
    averageBlockTime: 1,
    nativeToken: 'ETH',
    nativeTokenPrecision: 18,
    blockExplorerName: 'Etherscan',
    blockExplorerUrl: 'https://goerli.etherscan.io',
    rpcUrl: import.meta.env.VITE_GOERLI_RPC_URL,
    managePositionTokensV1: ['stETH', 'wstETH-v1', 'rETH'],
    managePositionTokensV2: ['wstETH'],
  },
};
export default config;
