import { bind } from '@react-rxjs/core';
import { of } from 'rxjs';
import { getConfigManager } from '../config';

const DEFAULT_VALUE = getConfigManager().getConfig();
export const config$ = of(DEFAULT_VALUE);

export const [useConfig] = bind(config$, DEFAULT_VALUE);
