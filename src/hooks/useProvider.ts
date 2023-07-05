import { JsonRpcApiProviderOptions, JsonRpcProvider } from 'ethers';
import { BehaviorSubject } from 'rxjs';
import { bind } from '@react-rxjs/core';
import { getConfigManager } from '../config';

const config = getConfigManager().getConfig();

// Required for Tenderly fork
const options: JsonRpcApiProviderOptions = {
  batchMaxCount: 1,
};

const DEFAULT_VALUE = new JsonRpcProvider(config.rpcUrl, 'any', options);

export const provider$ = new BehaviorSubject(DEFAULT_VALUE);

export const [useProvider] = bind(provider$, DEFAULT_VALUE);
