export interface ChainConfig extends LocalConfig {
  positionManager: string;
  positionManagerStEth: string;
  collateralTokens: { [tokenName: string]: string };
  raftCollateralToken: string;
  raftDebtToken: string;
  rToken: string;
}

export type LocalConfig = {
  publicNetworkUrl: string;
  privateNetworkUrl: string;
  networkName: string;
  alchemyKey: string;
  chainId: number;
  averageBlockTime: number;
  nativeToken: 'ETH';
  nativeTokenPrecision: number;
  blockExplorerName: 'Etherscan';
  blockExplorerUrl: string;
  rpcUrl: string;
};

export type Config = {
  [chainName: string]: ChainConfig;
};
