import { Config } from '../interfaces';

const config: Config = {
  ethereum: {
    positionManager: {
      address: '0x0feded544f10661fa11a85f6bd5381153d04ea73',
    },
    publicNetworkUrl: '',
    privateNetworkUrl: '',
    networkName: '',
    alchemyKey: '',
    chainId: 1,
    /**
     * Average block time on chain in seconds.
     */
    averageBlockTime: 1,
    nativeToken: 'ETH',
    nativeTokenPrecision: 18,
    blockExplorerName: 'Etherscan',
    blockExplorerUrl: '',
  },
};
export default config;
