import { EIP1193Provider } from '@web3-onboard/common';
import { BrowserProvider } from 'ethers';
import { atom } from 'jotai';
import { Nullable } from '../interfaces';

export const eip1193ProviderAtom = atom<Nullable<EIP1193Provider>>(null);

export const walletAtom = atom<Nullable<BrowserProvider>>(get => {
  const eip1193Provider = get(eip1193ProviderAtom);

  if (!eip1193Provider) return null;

  return new BrowserProvider(eip1193Provider);
});
