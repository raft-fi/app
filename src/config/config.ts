import { RaftConfig, SupportedNetwork } from '@raft-fi/sdk';
import { Config } from '../interfaces';

const FALLBACK_NETWORK: SupportedNetwork = 'goerli';
export const NETWORK: SupportedNetwork = import.meta.env.VITE_NETWORK ?? FALLBACK_NETWORK;

RaftConfig.setNetwork(NETWORK);
RaftConfig.setSubgraphEndpoint(import.meta.env.VITE_SUBGRAPH_URL);

const config: Config = {
  mainnet: {
    positionManager: RaftConfig.networkConfig.positionManager,
    positionManagerStEth: RaftConfig.networkConfig.positionManagerStEth,
    collateralTokens: {
      wstETH: RaftConfig.networkConfig.wstEth,
    },
    raftCollateralToken: RaftConfig.networkConfig.raftCollateralTokens.wstETH,
    raftDebtToken: RaftConfig.networkConfig.raftDebtToken,
    rToken: RaftConfig.networkConfig.r,
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
  },
  goerli: {
    positionManager: RaftConfig.networkConfig.positionManager,
    positionManagerStEth: RaftConfig.networkConfig.positionManagerStEth,
    collateralTokens: {
      wstETH: RaftConfig.networkConfig.wstEth,
    },
    raftCollateralToken: RaftConfig.networkConfig.raftCollateralTokens.wstETH,
    raftDebtToken: RaftConfig.networkConfig.raftDebtToken,
    rToken: RaftConfig.networkConfig.r,
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
  },
};
export default config;
