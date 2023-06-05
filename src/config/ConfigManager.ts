import { RaftConfig } from '@raft-fi/sdk';
import { Config } from '../interfaces';
import { ChainConfig } from '../interfaces/Config';
import config, { NETWORK } from './config';

class ConfigManager {
  private config: Config = config;

  constructor() {
    RaftConfig.setNetwork(NETWORK);
    RaftConfig.setSubgraphEndpoint(import.meta.env.VITE_SUBGRAPH_URL);
  }

  getConfig(): ChainConfig {
    return this.config[NETWORK];
  }
}

export default ConfigManager;
