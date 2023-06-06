import { map } from 'rxjs';
import { PriceFeed } from '@raft-fi/sdk';
import { provider$ } from './useProvider';

export const priceFeed$ = provider$.pipe(map(provider => new PriceFeed(provider)));
