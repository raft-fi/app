import { SupportedBridgeNetwork, SupportedSavingsNetwork } from '@raft-fi/sdk';
import { EIP1193Provider } from '@web3-onboard/common';
import { Nullable } from '../interfaces';
import { NETWORK_IDS, NETWORK_NAMES, NETWORK_WALLET_CURRENCIES, NETWORK_WALLET_ENDPOINTS } from '../networks';

export const switchNetwork = async (
  provider: Nullable<EIP1193Provider>,
  network: SupportedBridgeNetwork | SupportedSavingsNetwork,
) => {
  if (provider) {
    try {
      // https://eips.ethereum.org/EIPS/eip-3326
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${NETWORK_IDS[network].toString(16)}` }],
      });
    } catch (error) {
      const chainId = `0x${NETWORK_IDS[network].toString(16)}`;

      // error msg mentioned chainId
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hasMentionedChainId = (((error as any).message as string) ?? '').includes(chainId);

      // desktop metamask error code 4902
      // https://docs.metamask.io/wallet/reference/rpc-api/#returns-4
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isErrorCode4902 = (error as any).code === 4902;

      if (hasMentionedChainId || isErrorCode4902) {
        // https://eips.ethereum.org/EIPS/eip-3085
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${NETWORK_IDS[network].toString(16)}`,
              chainName: NETWORK_NAMES[network],
              rpcUrls: [NETWORK_WALLET_ENDPOINTS[network]],
              nativeCurrency: NETWORK_WALLET_CURRENCIES[network],
            },
          ],
        });
      } else {
        console.error(`Failed to switch network to ${network}`);
      }
    }
  }
};
