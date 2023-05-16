import { JsonRpcProvider } from 'ethers';
import { of } from 'rxjs';

const defaultRpcUrl = import.meta.env.VITE_GOERLI_RPC_URL;

// TODO - Select RPC URL based on current user network (or use default if wallet is not connected)
const DEFAULT_VALUE = new JsonRpcProvider(defaultRpcUrl);
export const provider$ = of(DEFAULT_VALUE);
