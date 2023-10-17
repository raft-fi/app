import { JsonRpcApiProviderOptions, JsonRpcProvider } from 'ethers';
import { BehaviorSubject } from 'rxjs';
import { bind } from '@react-rxjs/core';
import { getConfigManager } from '../config';

const config = getConfigManager().getConfig();

const NETWORK_OPTIONS = {
  batchStallTime: 50,
};
const FORK_NETWORK_OPTIONS = {
  batchMaxCount: 1,
};

const options: JsonRpcApiProviderOptions = import.meta.env.VITE_IS_FORK_NETWORK
  ? FORK_NETWORK_OPTIONS
  : NETWORK_OPTIONS;

const DEFAULT_VALUE = new JsonRpcProvider(config.rpcUrl, 'any', options);

export const provider$ = new BehaviorSubject(DEFAULT_VALUE);

export const [useProvider] = bind(provider$, DEFAULT_VALUE);
