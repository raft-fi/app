import { useCallback, useEffect, useMemo, useState } from 'react';
import { init, useConnectWallet, useWallets } from '@web3-onboard/react';
import injectedModule from '@web3-onboard/injected-wallets';
import ledgerModule from '@web3-onboard/ledger';
import { ButtonWrapper } from 'tempus-ui';
import { shortenAddress } from '../../utils';
import { Typography, ButtonPrimary, Icon, ModalWrapper } from '../shared';
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

  const [popupOpen, setPopupOpen] = useState(false);

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

  const onDisconnect = useCallback(() => {
    if (!wallet) {
      return null;
    }

    disconnect(wallet);
    setPopupOpen(false);
  }, [wallet, disconnect]);

  const shortenedAddress = useMemo(() => {
    if (!wallet) {
      return null;
    }

    return shortenAddress(wallet.accounts[0].address);
  }, [wallet]);

  const shortenedAddressPopup = useMemo(() => {
    if (!wallet) {
      return null;
    }

    return shortenAddress(wallet.accounts[0].address, 10, 8);
  }, [wallet]);

  const handlePopupOpen = useCallback(() => {
    setPopupOpen(true);
  }, []);

  const handlePopupClose = useCallback(() => {
    setPopupOpen(false);
  }, []);

  const onViewOnEtherscanClick = useCallback(() => {
    if (!wallet) {
      return null;
    }

    window.open(`https://etherscan.io/address/${wallet.accounts[0].address}`, '_blank', 'noopener,noreferrer');
  }, [wallet]);

  const onCopyAddress = useCallback(() => {
    if (!wallet) {
      return null;
    }

    navigator.clipboard.writeText(wallet.accounts[0].address);
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
          <ButtonPrimary onClick={handlePopupOpen}>
            <Icon variant="profile" />
            <Typography variant="subtitle" weight="medium">
              {shortenedAddress}
            </Typography>
          </ButtonPrimary>
        </div>
      )}

      <ModalWrapper open={popupOpen} onClose={handlePopupClose}>
        <div className="raft__wallet__popup">
          <div className="raft__wallet__popupHeader">
            <ButtonWrapper className="raft__wallet__popupClose" onClick={handlePopupClose}>
              <Icon variant="close" size="tiny" />
            </ButtonWrapper>
          </div>
          <div className="raft__wallet__popupAddress">
            <Icon variant="profile" size={20} />
            <Typography variant="subtitle" weight="semi-bold">
              {shortenedAddressPopup}
            </Typography>
          </div>
          <div className="raft__wallet__popupActions">
            <ButtonWrapper className="raft__wallet__popupAction" onClick={onViewOnEtherscanClick}>
              <Icon variant="external-link" size={16} />
              <Typography variant="body-primary" weight="medium">
                View on Etherscan
              </Typography>
            </ButtonWrapper>
            <ButtonWrapper className="raft__wallet__popupAction" onClick={onCopyAddress}>
              <Icon variant="copy" size={16} />
              <Typography variant="body-primary" weight="medium">
                Copy address
              </Typography>
            </ButtonWrapper>
          </div>
          <div className="raft__wallet_popupTransactions">
            {/* Load list of transaction and show it here as as list */}
            <div className="raft__wallet__popupTransaction">
              <Typography variant="body-secondary">Repayment 20,000 R</Typography>
            </div>
            <div className="raft__wallet__popupTransaction">
              <Typography variant="body-secondary">Repayment 10,000 R</Typography>
            </div>
            <div className="raft__wallet__popupTransaction">
              <Typography variant="body-secondary">Repayment 40,000 R</Typography>
            </div>
          </div>
          <div className="raft__wallet__popupActions">
            <ButtonWrapper
              className="raft__wallet__popupAction raft__wallet__popupActionMaxWidth"
              onClick={onDisconnect}
            >
              <Typography variant="body-primary" weight="medium">
                Disconnect wallet
              </Typography>
            </ButtonWrapper>
          </div>
        </div>
      </ModalWrapper>
    </div>
  );
};
export default Wallet;
