import { RaftConfig } from '@raft-fi/sdk';
import { Config } from '../interfaces';

const config: Config = {
  ethereum: {
    positionManager: RaftConfig.addresses.positionManager,
    collateralTokens: {
      wstETH: RaftConfig.addresses.wstEth,
    },
    raftCollateralToken: RaftConfig.addresses.raftCollateralTokens.wstETH,
    raftDebtToken: RaftConfig.addresses.raftDebtToken,
    rToken: RaftConfig.addresses.r,
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
    positionManager: RaftConfig.addresses.positionManager,
    collateralTokens: {
      wstETH: RaftConfig.addresses.wstEth,
    },
    raftCollateralToken: RaftConfig.addresses.raftCollateralTokens.wstETH,
    raftDebtToken: RaftConfig.addresses.raftDebtToken,
    rToken: RaftConfig.addresses.r,
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
