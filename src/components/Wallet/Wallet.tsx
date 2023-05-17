import { useCallback, useEffect, useMemo, useState } from 'react';
import { init, useConnectWallet, useWallets } from '@web3-onboard/react';
import injectedModule from '@web3-onboard/injected-wallets';
import ledgerModule from '@web3-onboard/ledger';
import WalletConnectModule from '@web3-onboard/walletconnect';
import { ButtonWrapper } from 'tempus-ui';
import { shortenAddress } from '../../utils';
import { updateWalletFromEIP1193Provider, useConfig, useENS, useNetwork, useTransactionHistory } from '../../hooks';
import { Typography, Button, Icon, ModalWrapper } from '../shared';
import NetworkErrorModal from '../NetworkErrorModal';
import LiquidationModal from '../LiquidationModal';
import NotificationCenter from '../NotificationCenter';
import TransactionHistoryRow from './TransactionHistoryRow';
import getStarted from './logo/get-started.svg';

import './Wallet.scss';

const injected = injectedModule();
const ledger = ledgerModule();
const walletConnect = WalletConnectModule();

init({
  wallets: [injected, ledger, walletConnect],
  chains: [
    {
      id: '0x1',
      token: 'ETH',
      label: 'Ethereum Mainnet',
      rpcUrl: import.meta.env.VITE_MAINNET_RPC_URL,
    },
    {
      id: '0x5',
      token: 'GoerliETH',
      label: 'Goerli test network',
      rpcUrl: import.meta.env.VITE_GOERLI_RPC_URL,
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
  const config = useConfig();
  const [{ wallet }, connect, disconnect] = useConnectWallet();
  const { isWrongNetwork, switchToSupportedNetwork } = useNetwork();
  const connectedWallets = useWallets();
  const ens = useENS();
  const transactionHistory = useTransactionHistory();

  const [popupOpen, setPopupOpen] = useState(false);
  const connectedAddress = wallet?.accounts?.[0]?.address ?? '';

  /**
   * Update wallet hook every time user changes wallet
   */
  useEffect(() => {
    if (!wallet) {
      updateWalletFromEIP1193Provider(null);
      return;
    }

    updateWalletFromEIP1193Provider(wallet.provider);
  }, [wallet]);

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

    return ens.name ?? shortenAddress(connectedAddress);
  }, [connectedAddress, ens.name, wallet]);

  const shortenedAddressPopup = useMemo(() => {
    if (!wallet) {
      return null;
    }

    return ens.name ?? shortenAddress(connectedAddress, 10, 8);
  }, [connectedAddress, ens.name, wallet]);

  const lastLiquidation = useMemo(
    () => (transactionHistory?.filter(transaction => transaction.type === 'LIQUIDATION') ?? [])[0],
    [transactionHistory],
  );

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

    window.open(`${config.blockExplorerUrl}/address/${connectedAddress}`, '_blank', 'noopener,noreferrer');
  }, [config.blockExplorerUrl, connectedAddress, wallet]);

  const onCopyAddress = useCallback(() => {
    if (!wallet) {
      return null;
    }

    navigator.clipboard.writeText(connectedAddress);
  }, [connectedAddress, wallet]);

  return (
    <div className="raft__wallet">
      {!wallet && (
        <div className="raft__wallet__disconnected">
          <Button variant="primary" onClick={onConnect}>
            <Typography variant="body-primary" weight="bold" color="text-primary-inverted">
              Connect
            </Typography>
          </Button>
        </div>
      )}

      {wallet && isWrongNetwork && (
        <div className="raft__wallet__wrongNetwork">
          <Button variant="tertiary" onClick={switchToSupportedNetwork}>
            <Icon variant="error" />
            <Typography variant="body-primary" weight="medium" color="text-error">
              Unsupported network
            </Typography>
          </Button>
        </div>
      )}

      {wallet && !isWrongNetwork && (
        <div className="raft__wallet__connected">
          <Button variant="tertiary" onClick={handlePopupOpen}>
            {ens.avatar ? (
              <img className="raft__wallet__connected__avatar" src={ens.avatar} />
            ) : (
              <Icon variant="profile" />
            )}
            <Typography variant="subtitle" weight="medium">
              {shortenedAddress}
            </Typography>
          </Button>
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
            {ens.avatar ? (
              <img className="raft__wallet__popupAddress__avatar" src={ens.avatar} />
            ) : (
              <Icon variant="profile" size={20} />
            )}
            <Typography variant="subtitle" weight="semi-bold">
              {shortenedAddressPopup}
            </Typography>
          </div>
          <div className="raft__wallet__popupActions">
            <Button variant="secondary" className="raft__wallet__popupAction" onClick={onViewOnEtherscanClick}>
              <Icon variant="external-link" size={16} />
              <Typography variant="body-primary" weight="medium">
                View on Etherscan
              </Typography>
            </Button>
            <Button variant="secondary" className="raft__wallet__popupAction" onClick={onCopyAddress}>
              <Icon variant="copy" size={16} />
              <Typography variant="body-primary" weight="medium">
                Copy address
              </Typography>
            </Button>
          </div>
          {transactionHistory && (
            <div className="raft__wallet_popupTransactions">
              <div className="raft__wallet__popupTransactionsContainer">
                {transactionHistory.map(transaction => {
                  return <TransactionHistoryRow key={transaction.id} transaction={transaction} />;
                })}
              </div>
            </div>
          )}
          <div className="raft__wallet__popupActions">
            <Button
              variant="secondary"
              className="raft__wallet__popupAction raft__wallet__popupActionMaxWidth"
              onClick={onDisconnect}
            >
              <Typography variant="body-primary" weight="medium">
                Disconnect wallet
              </Typography>
            </Button>
          </div>
        </div>
      </ModalWrapper>
      {wallet && (
        <>
          <NetworkErrorModal />
          {connectedAddress && lastLiquidation && (
            <LiquidationModal
              key={`liquidation-modal-${lastLiquidation.id}`}
              walletAddress={connectedAddress}
              liquidationTransaction={lastLiquidation}
            />
          )}
          <NotificationCenter />
        </>
      )}
    </div>
  );
};
export default Wallet;
