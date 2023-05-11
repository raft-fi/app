import { Config } from '../interfaces';

const config: Config = {
  ethereum: {
    positionManager: '0xfFaAB9cb73844DE549d28B4fFe348f48eff267C9',
    collateralTokens: {
      wstETH: '0x6320cD32aA674d2898A68ec82e869385Fc5f7E2f',
    },
    raftCollateralToken: '0xEff7d350DDF490CB3b12A96Adc476F0ee5908efE',
    raftDebtToken: '0x8f616D781e799fE8e150AE98F3e233722007e536',
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
    blockExplorerUrl: 'https://etherscan.io',
  },
  goerli: {
    positionManager: '0xfFaAB9cb73844DE549d28B4fFe348f48eff267C9',
    collateralTokens: {
      wstETH: '0x6320cD32aA674d2898A68ec82e869385Fc5f7E2f',
    },
    raftCollateralToken: '0xEff7d350DDF490CB3b12A96Adc476F0ee5908efE',
    raftDebtToken: '0x8f616D781e799fE8e150AE98F3e233722007e536',
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
    blockExplorerUrl: 'https://goerli.etherscan.io',
  },
};
export default config;
