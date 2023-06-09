import { JsonRpcProvider } from 'ethers';
import { BehaviorSubject } from 'rxjs';
import { bind } from '@react-rxjs/core';
import { getConfigManager } from '../config';

const config = getConfigManager().getConfig();

const DEFAULT_VALUE = new JsonRpcProvider(config.rpcUrl);

export const provider$ = new BehaviorSubject(DEFAULT_VALUE);

export const [useProvider] = bind(provider$, DEFAULT_VALUE);
