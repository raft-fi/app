import { FC, useEffect } from 'react';
import {
  subscribeCollateralBalances,
  subscribeDebtBalances,
  subscribeENS,
  subscribeProtocolStats,
  subscribeTokenBalances,
  subscribeTokenPrices,
  subscribeEIP1193Provider,
  subscribeTransactionHistory,
  subscribeTokenAllowances,
  subscribeTokenWhitelists,
  subscribeAppLoaded,
  subscribeCollateralBorrowingRate,
  subscribeCollateralConversionRate,
} from '../../hooks';

const HookSubscriber: FC = () => {
  // to keep at least one subscriber of the stream insides the state hooks

  // subscribe for the steam$ of the polling hooks
  useEffect(() => {
    subscribeAppLoaded();
    subscribeENS();
    subscribeTokenPrices();
    subscribeTokenBalances();
    subscribeProtocolStats();
    subscribeCollateralBalances();
    subscribeDebtBalances();
    subscribeEIP1193Provider();
    subscribeTransactionHistory();
    subscribeTokenAllowances();
    subscribeTokenWhitelists();
    subscribeCollateralBorrowingRate();
    subscribeCollateralConversionRate();
  }, []);

  return null;
};

export default HookSubscriber;
