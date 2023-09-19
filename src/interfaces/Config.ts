import { SupportedCollateralToken } from './types';

export interface ChainConfig {
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
  rpcUrl: string;
  managePositionTokensV1: SupportedCollateralToken[];
  managePositionTokensV2: SupportedCollateralToken[];
}

export type Config = {
  [chainName: string]: ChainConfig;
};
