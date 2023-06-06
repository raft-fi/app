import { JsonRpcProvider } from 'ethers';
import { BehaviorSubject } from 'rxjs';
import { getConfigManager } from '../config';

const config = getConfigManager().getConfig();

const DEFAULT_VALUE = new JsonRpcProvider(config.rpcUrl);

export const provider$ = new BehaviorSubject(DEFAULT_VALUE);
