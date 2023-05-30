import { LocalConfig } from '../interfaces';

const config: {
  [chainName: string]: LocalConfig;
} = {
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
  },
};
export default config;
