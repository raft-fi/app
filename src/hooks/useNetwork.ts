import { concatMap, combineLatest, map } from 'rxjs';
import { bind } from '@react-rxjs/core';
import { NETWORK_IDS } from '../networks';
import { eip1193Provider$, wallet$ } from './useWallet';
import { config$ } from './useConfig';
import { currentSavingsNetwork$ } from './useCurrentSavingsNetwork';

const DEFAULT_VALUE = {
  network: null,
  isWrongNetwork: false,
  isWrongSavingsNetwork: false,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  switchToSupportedNetwork: () => {},
};

export const network$ = wallet$.pipe(
  concatMap(async wallet => {
    if (!wallet) {
      return null;
    }
    return wallet.getNetwork();
  }),
);

export const isWrongNetwork$ = combineLatest([network$, config$]).pipe(
  map(([network, config]) => Boolean(network && network.chainId.toString() !== String(config.chainId))),
);

export const isWrongSavingsNetwork$ = combineLatest([network$, currentSavingsNetwork$]).pipe(
  map(([network, currentSavingsNetwork]) => {
    return Boolean(network && network.chainId.toString() !== NETWORK_IDS[currentSavingsNetwork].toString());
  }),
);

const props$ = combineLatest([network$, eip1193Provider$, config$, isWrongNetwork$, isWrongSavingsNetwork$]).pipe(
  map(([network, eip1193Provider, config, isWrongNetwork, isWrongSavingsNetwork]) => ({
    network,
    isWrongNetwork,
    isWrongSavingsNetwork,
    switchToSupportedNetwork: () => {
      if (eip1193Provider) {
        // https://eips.ethereum.org/EIPS/eip-3326
        eip1193Provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${Number(config.chainId).toString(16)}` }],
        });
      }
    },
  })),
);

export const [useNetwork] = bind(props$, DEFAULT_VALUE);
