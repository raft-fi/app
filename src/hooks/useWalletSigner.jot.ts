import { JsonRpcSigner } from 'ethers';
import { atom } from 'jotai';
import { Nullable } from '../interfaces';

const walletSignerAtom = atom<Nullable<JsonRpcSigner>>(null);
