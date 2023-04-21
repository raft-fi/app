import { useCallback, useEffect, useMemo } from 'react';
import { init, useConnectWallet, useWallets } from '@web3-onboard/react';
import injectedModule from '@web3-onboard/injected-wallets';
import ledgerModule from '@web3-onboard/ledger';
import { shortenAddress } from '../../utils';
import { Typography, ButtonPrimary, Icon } from '../shared';
import getStarted from './logo/get-started.svg';

import './Wallet.scss';

const injected = injectedModule();
const ledger = ledgerModule();

init({
  wallets: [injected, ledger],
  chains: [
    {
      id: '0x1',
      token: 'ETH',
      label: 'Ethereum Mainnet',
      rpcUrl: process.env.REACT_APP_RPC_URL,
    },
  ],
  accountCenter: {
    desktop: {
      enabled: false,
    },
    mobile: {
      enabled: false,
    },
  },
  appMetadata: {
    name: 'Raft',
    description:
      'Connecting your wallet is like “logging in” to Web3. Select your wallet from the options to get started.',
    recommendedInjectedWallets: [{ name: 'MetaMask', url: 'https://metamask.io' }],
    agreement: {
      version: '1.0',
      privacyUrl: 'https://www.raft.fi/privacy/', // TODO - Add terms of service url as well once page is done
    },
    logo: getStarted,
  },
  disableFontDownload: true,
});

const LAST_CONNECTED_WALLET_STORAGE_KEY = 'raftConnectedWallets';

const Wallet = () => {
  const [{ wallet }, connect, disconnect] = useConnectWallet();
  const connectedWallets = useWallets();

  /**
   * Every time list of connected wallets changes, we want to store labels of those wallets in local storage.
   * Next time user opens the app, we will use this data to auto-connect wallet for the user.
   */
  useEffect(() => {
    const connectedWalletLabels = connectedWallets.map(connectedWallet => connectedWallet.label);

    if (connectedWalletLabels.length > 0) {
      window.localStorage.setItem(LAST_CONNECTED_WALLET_STORAGE_KEY, JSON.stringify(connectedWalletLabels));
    }
  }, [connectedWallets]);

  /**
   * Check if user already connected any of his wallets in previous sessions, if yes,
   * automatically connect first wallet from list of previously connected wallets.
   */
  useEffect(() => {
    const previouslyConnectedWallets = JSON.parse(
      window.localStorage.getItem(LAST_CONNECTED_WALLET_STORAGE_KEY) || '[]',
    ) as string[];
    if (previouslyConnectedWallets && previouslyConnectedWallets.length > 0) {
      connect({
        autoSelect: {
          disableModals: true,
          label: previouslyConnectedWallets[0],
        },
      });
    }
  }, [connect]);

  /**
   * If user disconnected all of his wallets - we need to clear last connected wallet info from local
   * storage to prevent app from trying to connect automatically on app load
   */
  useEffect(() => {
    if (connectedWallets.length === 0) {
      window.localStorage.removeItem(LAST_CONNECTED_WALLET_STORAGE_KEY);
    }
  }, [connectedWallets]);

  const onConnect = useCallback(() => {
    connect();
  }, [connect]);

  const shortenedAddress = useMemo(() => {
    if (!wallet) {
      return null;
    }

    return shortenAddress(wallet.accounts[0].address);
  }, [wallet]);

  return (
    <div className="raft__wallet">
      {!wallet && (
        <div className="raft__wallet__disconnected">
          <ButtonPrimary onClick={onConnect}>
            <Typography variant="subtitle" weight="medium" color="text-primary-inverted">
              Connect
            </Typography>
          </ButtonPrimary>
        </div>
      )}

      {wallet && (
        <div className="raft__wallet__connected">
          {/* TODO - Show wallet modal popup on click */}
          <ButtonPrimary onClick={() => {}}>
            <Icon variant="profile" />
            <Typography variant="subtitle" weight="medium">
              {shortenedAddress}
            </Typography>
          </ButtonPrimary>
        </div>
      )}
    </div>
  );
};
export default Wallet;
