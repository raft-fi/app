import { RaftConfig } from '@raft-fi/sdk';
import { Config } from '../interfaces';
import { ChainConfig } from '../interfaces/Config';
import config, { NETWORK } from './config';

class ConfigManager {
  private config: Config = config;

  constructor() {
    RaftConfig.setNetwork(NETWORK);
  }

  getConfig(): ChainConfig {
    return this.config[NETWORK];
  }
}

export default ConfigManager;
