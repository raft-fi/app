import { RaftConfig } from '@raft-fi/sdk';
import { Chain, Config, Nullable } from '../interfaces';
import { ChainConfig } from '../interfaces/Config';
import config from './config';

const FALLBACK_NETWORK = 'goerli';

export interface TokenListItem {
  chain: Chain;
  address: string;
}

class ConfigManager {
  private config: Config = config;

  getConfig(): ChainConfig {
    // SDK tells which network is active
    const defaultNetwork = Object.keys(config).reduce(
      (network, key) => (config[key].chainId === RaftConfig.networkId ? key : network),
      null as Nullable<string>,
    );
    // ENV tells which network is active
    const configuredNetwork = import.meta.env.NETWORK;

    // if ENV is set in specific, take it. otherwise take the active network from SDK
    return this.config[configuredNetwork ?? defaultNetwork ?? FALLBACK_NETWORK];
  }
}

export default ConfigManager;
