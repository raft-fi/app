import { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import SafeAppsSDK, { SafeInfo } from '@safe-global/safe-apps-sdk';
import { PositionTransaction, SavingsTransaction, StakingTransaction } from '@raft-fi/sdk';
import { init, useConnectWallet, useWallets } from '@web3-onboard/react';
import injectedModule from '@web3-onboard/injected-wallets';
import ledgerModule from '@web3-onboard/ledger';
import WalletConnectModule from '@web3-onboard/walletconnect';
import gnosisModule from '@web3-onboard/gnosis';
import { ButtonWrapper } from 'tempus-ui';
import { shortenAddress } from '../../utils';
import { Nullable } from '../../interfaces';
import {
  HistoryTransaction,
  updateWalletFromEIP1193Provider,
  useWalletLoaded,
  updateWalletLabel,
  useConfig,
  useENS,
  useNetwork,
  useTransactionHistory,
} from '../../hooks';
import { Typography, Button, Icon, ModalWrapper } from '../shared';
import NetworkErrorModal from '../NetworkErrorModal';
import LiquidationModal from '../LiquidationModal';
import {
  BridgeRequestTransactionRow,
  ManageTransactionRow,
  SavingsTransactionRow,
  StakingTransactionRow,
} from './TransactionHistoryRow';
import getStarted from './logo/get-started.svg';

import './Wallet.scss';

const isSavingsTransaction = (transaction: HistoryTransaction): transaction is SavingsTransaction => {
  return transaction.type === 'DEPOSIT' || transaction.type === 'WITHDRAW';
};

const isStakingTransaction = (transaction: HistoryTransaction): transaction is StakingTransaction => {
  return ['DEPOSIT_FOR', 'CREATE_LOCK', 'INCREASE_LOCK_AMOUNT', 'INCREASE_UNLOCK_TIME', 'WITHDRAW'].includes(
    transaction.type,
  );
};

const isManageTransaction = (transaction: HistoryTransaction): transaction is PositionTransaction => {
  return (
    transaction.type === 'ADJUST' ||
    transaction.type === 'CLOSE' ||
    transaction.type === 'OPEN' ||
    transaction.type === 'LIQUIDATION'
  );
};

const safeSdk = new SafeAppsSDK();
const injected = injectedModule();
const ledger = ledgerModule({
  walletConnectVersion: 2,
  projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID,
});
const walletConnect = WalletConnectModule({
  projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID,
});
const gnosis = gnosisModule();

init({
  wallets: [injected, ledger, walletConnect, gnosis],
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
    logo: getStarted,
    explore: 'https://raft.fi',
  },
  disableFontDownload: true,
});

const LAST_CONNECTED_WALLET_STORAGE_KEY = 'raftConnectedWallets';
const SAFE_TIMEOUT_IN_MS = 200;

interface WalletProps {
  skipNetworkChecking?: boolean;
}

const Wallet: FC<WalletProps> = ({ skipNetworkChecking }) => {
  const config = useConfig();
  const walletLoaded = useWalletLoaded();
  const [{ wallet }, connect, disconnect] = useConnectWallet();
  const { isWrongNetwork, switchToSupportedNetwork } = useNetwork();
  const connectedWallets = useWallets();
  const ens = useENS();
  const transactionHistory = useTransactionHistory();

  const [popupOpen, setPopupOpen] = useState(false);
  const [safeApp, setSafeApp] = useState<Nullable<SafeInfo>>(null);
  const connectedAddress = wallet?.accounts?.[0]?.address ?? '';

  useEffect(() => {
    const tryToGetSafeApp = async () => {
      const safe = await Promise.race([
        safeSdk.safe.getInfo(),
        new Promise<null>(resolve => setTimeout(resolve, SAFE_TIMEOUT_IN_MS)),
      ]);

      setSafeApp(safe);
    };

    tryToGetSafeApp();
  }, []);

  /**
   * Update wallet hook every time user changes wallet
   */
  useEffect(() => {
    if (!wallet) {
      updateWalletFromEIP1193Provider(null);
      updateWalletLabel(null);
      return;
    }

    updateWalletFromEIP1193Provider(wallet.provider);
    updateWalletLabel(wallet.label);
  }, [wallet]);

  /**
   * If it's not Gnosis Safe app,
   * every time list of connected wallets changes, we store labels of those wallets in local storage.
   * Next time user opens the app, we will use this data to auto-connect wallet for the user.
   */
  useEffect(() => {
    const connectedWalletLabels = connectedWallets.map(connectedWallet => connectedWallet.label);

    if (connectedWalletLabels.length > 0 && !safeApp) {
      window.localStorage.setItem(LAST_CONNECTED_WALLET_STORAGE_KEY, JSON.stringify(connectedWalletLabels));
    }
  }, [connectedWallets, safeApp]);

  /**
   * Check if user already connected any of his wallets in previous sessions, if yes,
   * automatically connect first wallet from list of previously connected wallets.
   */
  useEffect(() => {
    if (safeApp && safeApp.chainId === 1) {
      connect({
        autoSelect: {
          disableModals: true,
          label: 'Safe',
        },
      });
    } else {
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
    }
  }, [connect, safeApp]);

  /**
   * If user disconnected all of his wallets - we need to clear last connected wallet info from local
   * storage to prevent app from trying to connect automatically on app load
   */
  useEffect(() => {
    if (connectedWallets.length === 0 && !safeApp) {
      window.localStorage.removeItem(LAST_CONNECTED_WALLET_STORAGE_KEY);
    }
  }, [connectedWallets, safeApp]);

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
    () =>
      (transactionHistory?.filter((transaction): transaction is PositionTransaction => {
        return transaction.type === 'LIQUIDATION';
      }) ?? [])[0],
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

  if (!walletLoaded) {
    return <div className="raft__wallet raft__wallet-loading" />;
  }

  return (
    <div className="raft__wallet">
      {!wallet && (
        <div className="raft__wallet__disconnected">
          <Button variant="primary" text="Connect" onClick={onConnect} />
        </div>
      )}

      {wallet && isWrongNetwork && !skipNetworkChecking && (
        <div className="raft__wallet__wrongNetwork">
          <Button variant="error" onClick={switchToSupportedNetwork} text="Unsupported network" />
        </div>
      )}

      {wallet && !(isWrongNetwork && !skipNetworkChecking) && (
        <div className="raft__wallet__connected">
          <Button variant="secondary" onClick={handlePopupOpen}>
            {ens.avatar ? (
              <img className="raft__wallet__connected__avatar" src={ens.avatar} />
            ) : (
              <Icon variant="profile" />
            )}
            <Typography variant="button-label" color="text-secondary">
              {shortenedAddress}
            </Typography>
          </Button>
        </div>
      )}

      <ModalWrapper open={popupOpen} onClose={handlePopupClose}>
        <div className="raft__wallet__popup">
          <div className="raft__wallet__popupHeader">
            <ButtonWrapper className="raft__wallet__popupClose" onClick={handlePopupClose}>
              <Icon variant="close" size="small" />
            </ButtonWrapper>
          </div>
          <div className="raft__wallet__popupAddress">
            {ens.avatar ? (
              <img className="raft__wallet__popupAddress__avatar" src={ens.avatar} />
            ) : (
              <Icon variant="profile" size={20} />
            )}
            <Typography variant="heading2" color="text-secondary">
              {shortenedAddressPopup}
            </Typography>
          </div>
          <div className="raft__wallet__popupActions">
            <Button
              variant="secondary"
              size="large"
              className="raft__wallet__popupAction"
              onClick={onViewOnEtherscanClick}
            >
              <Icon variant="external-link" size="small" />
              <Typography variant="button-label" color="text-secondary">
                View on Etherscan
              </Typography>
            </Button>
            <Button variant="secondary" size="large" className="raft__wallet__popupAction" onClick={onCopyAddress}>
              <Icon variant="copy" size="small" />
              <Typography variant="button-label" color="text-secondary">
                Copy address
              </Typography>
            </Button>
          </div>
          <div className="raft__wallet_popupTransactions">
            <div className="raft__wallet__popupTransactionsContainer">
              {transactionHistory?.length ? (
                transactionHistory.map(transaction => {
                  if (isSavingsTransaction(transaction)) {
                    return <SavingsTransactionRow key={transaction.id} transaction={transaction} />;
                  }
                  if (isStakingTransaction(transaction)) {
                    return <StakingTransactionRow key={transaction.id} transaction={transaction} />;
                  }
                  if (isManageTransaction(transaction)) {
                    return <ManageTransactionRow key={transaction.id} transaction={transaction} />;
                  }
                  return <BridgeRequestTransactionRow key={transaction.id} transaction={transaction} />;
                })
              ) : (
                <Typography
                  className="raft__wallet__popupTransactionsContainer__empty"
                  variant="body"
                  weight="medium"
                  color="text-secondary"
                >
                  No transactions
                </Typography>
              )}
            </div>
          </div>
          <div className="raft__wallet__popupActions">
            <Button
              variant="secondary"
              size="large"
              text="Disconnect wallet"
              className="raft__wallet__popupAction raft__wallet__popupActionMaxWidth"
              onClick={onDisconnect}
            />
          </div>
        </div>
      </ModalWrapper>
      {wallet && (
        <>
          {!skipNetworkChecking && <NetworkErrorModal />}
          {connectedAddress && lastLiquidation && (
            <LiquidationModal
              key={`liquidation-modal-${lastLiquidation.id}`}
              walletAddress={connectedAddress}
              liquidationTransaction={lastLiquidation}
            />
          )}
        </>
      )}
    </div>
  );
};
export default memo(Wallet);
