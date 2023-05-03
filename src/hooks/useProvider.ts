import { JsonRpcProvider } from 'ethers';
import { of } from 'rxjs';

const DEFAULT_VALUE = new JsonRpcProvider(import.meta.env.VITE_RPC_URL);
export const provider$ = of(DEFAULT_VALUE);
