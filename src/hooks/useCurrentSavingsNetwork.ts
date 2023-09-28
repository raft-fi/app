import { BehaviorSubject } from 'rxjs';
import { bind } from '@react-rxjs/core';
import { SupportedSavingsNetwork } from '@raft-fi/sdk';

let defaultNetwork: SupportedSavingsNetwork;
if (import.meta.env.VITE_ENVIRONMENT === 'mainnet') {
  defaultNetwork = 'mainnet';
} else {
  defaultNetwork = 'goerli';
}

export const currentSavingsNetwork$ = new BehaviorSubject<SupportedSavingsNetwork>(defaultNetwork);

export const setCurrentSavingsNetwork = (network: SupportedSavingsNetwork) => {
  currentSavingsNetwork$.next(network);
};

export const [useCurrentSavingsNetwork] = bind(currentSavingsNetwork$, defaultNetwork);
