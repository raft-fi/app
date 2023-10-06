import { Provider, TransactionReceipt } from 'ethers';
import { NUMBER_OF_CONFIRMATIONS_FOR_TX } from '../constants';
import { Nullable } from '../interfaces';

const POLL_INTERVAL = 12000;

export async function waitForTransactionReceipt(
  txHash: string,
  provider: Provider,
): Promise<Nullable<TransactionReceipt>> {
  if (!import.meta.env.VITE_IS_FORK_NETWORK) {
    return provider.waitForTransaction(txHash, NUMBER_OF_CONFIRMATIONS_FOR_TX);
  }

  // mainnet fork will run forever for waitForTransaction(), workaround
  let receipt: Nullable<TransactionReceipt> = null;

  try {
    receipt = await provider.getTransactionReceipt(txHash);
  } catch (error) {
    console.warn(`Failed to find tx with hash! Trying again in ${POLL_INTERVAL} milliseconds.`);
  }

  if (receipt) {
    return receipt;
  }

  await wait(POLL_INTERVAL);

  return waitForTransactionReceipt(txHash, provider);
}

async function wait(ms: number) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(true);
    }, ms);
  });
}
