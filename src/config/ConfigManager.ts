import { Chain, Config } from '../interfaces';
import { ChainConfig } from '../interfaces/Config';
import config from './config';

const DEFAULT_NETWORK = import.meta.env.NETWORK || 'goerli';

export interface TokenListItem {
  chain: Chain;
  address: string;
}

class ConfigManager {
  private config: Config = config;

  // TODO: load config from SDK
  getConfig(): ChainConfig {
    return this.config[DEFAULT_NETWORK];
  }
}

export default ConfigManager;
