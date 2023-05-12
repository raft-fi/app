import { of, from, concatMap, combineLatest, map } from 'rxjs';
import { bind } from '@react-rxjs/core';
import { eip1193Provider$, wallet$ } from './useWallet';
import { config$ } from './useConfig';

const DEFAULT_VALUE = {
  network: null,
  isWrongNetwork: false,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  switchToSupportedNetwork: () => {},
};

export const network$ = wallet$.pipe(
  concatMap(wallet => {
    if (!wallet) {
      return of(null);
    }
    return from(wallet.getNetwork());
  }),
);

const props$ = combineLatest([network$, eip1193Provider$, config$]).pipe(
  map(([network, eip1193Provider, config]) => ({
    network,
    isWrongNetwork: Boolean(network && network.chainId.toString() !== String(config.chainId)),
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
