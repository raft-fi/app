import { map } from 'rxjs';
import { PriceFeed } from 'raft-sdk';
import { provider$ } from './useProvider';

export const priceFeed$ = provider$.pipe(map(provider => new PriceFeed(provider)));
