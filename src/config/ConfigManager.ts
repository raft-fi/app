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
  private config: Config = {};

  getConfig(): ChainConfig {
    // SDK tells which network is active
    const defaultNetwork = Object.keys(config).reduce(
      (network, key) => (config[key].chainId === RaftConfig.networkId ? key : network),
      null as Nullable<string>,
    );
    // ENV tells which network is active
    const configuredNetwork = import.meta.env.VITE_NETWORK;

    // if ENV is set in specific, take it. otherwise take the active network from SDK
    const network = configuredNetwork ?? defaultNetwork ?? FALLBACK_NETWORK;

    // set RaftConfig network
    RaftConfig.setNetwork(network);

    if (!this.config || !Object.keys(this.config).length) {
      this.config = {
        mainnet: {
          ...config.mainnet,
          positionManager: RaftConfig.addresses.positionManager,
          positionManagerStEth: RaftConfig.addresses.positionManagerStEth,
          collateralTokens: {
            wstETH: RaftConfig.addresses.wstEth,
          },
          raftCollateralToken: RaftConfig.addresses.raftCollateralTokens.wstETH,
          raftDebtToken: RaftConfig.addresses.raftDebtToken,
          rToken: RaftConfig.addresses.r,
        },
        goerli: {
          ...config.goerli,
          positionManager: RaftConfig.addresses.positionManager,
          positionManagerStEth: RaftConfig.addresses.positionManagerStEth,
          collateralTokens: {
            wstETH: RaftConfig.addresses.wstEth,
          },
          raftCollateralToken: RaftConfig.addresses.raftCollateralTokens.wstETH,
          raftDebtToken: RaftConfig.addresses.raftDebtToken,
          rToken: RaftConfig.addresses.r,
        },
      };
    }

    return this.config[network];
  }
}

export default ConfigManager;
