import { Chain, Config } from '../interfaces';
import config from './config';

export interface TokenListItem {
  chain: Chain;
  address: string;
}

class ConfigManager {
  private config: Config = config;

  getConfig(): Config {
    return this.config;
  }
}

export default ConfigManager;
