import { Config } from '../interfaces';

const config: Config = {
  ethereum: {
    positionManager: '0x0feded544f10661fa11a85f6bd5381153d04ea73',
    collateralTokens: {
      wstETH: '0x6320cD32aA674d2898A68ec82e869385Fc5f7E2f',
    },
    raftCollateralToken: '0x3E579280498709835045c10f981fb0E78F45D086',
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
