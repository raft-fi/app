import { RaftConfig } from '@raft-fi/sdk';
import { Config } from '../interfaces';
import { ChainConfig } from '../interfaces/Config';
import config, { NETWORK } from './config';

class ConfigManager {
  private config: Config = config;

  constructor() {
    RaftConfig.setNetwork(NETWORK);
    RaftConfig.setEndpointOptions({
      subgraphEndpoint: import.meta.env.VITE_SUBGRAPH_URL,
      balancerSubgraphEndpoint: import.meta.env.VITE_BALANCER_SUBGRAPH_URL,
      oneInchEndpoint: import.meta.env.VITE_1INCH_API_URL,
      oneInchApiKey: import.meta.env.VITE_1INCH_API_KEY,
    });
  }

  getConfig(): ChainConfig {
    return this.config[NETWORK];
  }
}

export default ConfigManager;
