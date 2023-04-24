export interface ChainConfig {
  positionManager: unknown; // TODO
  publicNetworkUrl: string;
  privateNetworkUrl: string;
  networkName: string;
  alchemyKey: string;
  chainId: number;
  /**
   * Average block time on chain in seconds.
   */
  averageBlockTime: number;
  nativeToken: 'ETH';
  nativeTokenPrecision: number;
  blockExplorerName: 'Etherscan';
  blockExplorerUrl: string;
}

export type Config = {
  [chainName: string]: ChainConfig;
};
