import { Chain, Config } from '../interfaces';
import { ChainConfig } from '../interfaces/Config';
import config from './config';

export interface TokenListItem {
  chain: Chain;
  address: string;
}

class ConfigManager {
  private config: Config = config;

  getConfig(): ChainConfig {
    return this.config['ethereum'];
  }
}

export default ConfigManager;
