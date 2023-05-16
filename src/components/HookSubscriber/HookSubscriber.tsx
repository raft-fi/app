import { FC, useEffect } from 'react';
import {
  subscribeCollateralBalances,
  subscribeDebtBalances,
  subscribeENS,
  subscribeProtocolStats,
  subscribeTakenBalances,
  subscribeTakenPrices,
  subscribeEIP1193Provider,
  subscribeTransactionHistory,
} from '../../hooks';

const HookSubscriber: FC = () => {
  // to keep at least one subscriber of the stream insides the state hooks

  // subscribe for the steam$ of the polling hooks
  useEffect(() => {
    subscribeENS();
    subscribeTakenPrices();
    subscribeTakenBalances();
    subscribeProtocolStats();
    subscribeCollateralBalances();
    subscribeDebtBalances();
    subscribeEIP1193Provider();
    subscribeTransactionHistory();
  }, []);

  return null;
};

export default HookSubscriber;
