import { FC, useEffect } from 'react';
import {
  subscribeENS,
  subscribeProtocolStats,
  subscribeTokenBalances,
  subscribeTokenPrices,
  subscribeEIP1193Provider,
  subscribeTransactionHistory,
  subscribeTokenAllowances,
  subscribeTokenWhitelists,
  subscribeAppLoaded,
  subscribeCollateralBorrowingRates,
  subscribeCollateralConversionRates,
  subscribePosition,
  subscribeCollateralTokenConfig,
  subscribeCalculateRedemptionRate,
  subscribeCollateralPositionCaps,
  subscribeCollateralProtocolCaps,
  subscribeManageStatus,
  subscribeLeverageStatus,
  subscribeLeverageTokenWhitelists,
  subscribeLeverageTokenAllowances,
  subscribeCollateralTokenAprs,
  subscribeEstimateSwapPrice,
  subscribeLeveragePosition,
  subscribeRFlashMintFee,
  subscribeManageSavingsStatus,
  subscribeSavingsMaxDeposit,
  subscribeCurrentUserSavings,
  subscribeSavingsTvl,
  subscribeSavingsYield,
  subscribeManageTransactions,
  subscribeSavingsTransactions,
  subscribeBridgeTokensStatus,
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
    subscribeEIP1193Provider();
    subscribeTransactionHistory();
    subscribeTokenAllowances();
    subscribeLeverageTokenAllowances();
    subscribeTokenWhitelists();
    subscribeLeverageTokenWhitelists();
    subscribeCollateralBorrowingRates();
    subscribeCollateralConversionRates();
    subscribePosition();
    subscribeCollateralTokenConfig();
    subscribeCalculateRedemptionRate();
    subscribeCollateralPositionCaps();
    subscribeCollateralProtocolCaps();
    subscribeCollateralTokenAprs();
    subscribeManageStatus();
    subscribeManageSavingsStatus();
    subscribeBridgeTokensStatus();
    subscribeLeverageStatus();
    subscribeEstimateSwapPrice();
    subscribeLeveragePosition();
    subscribeRFlashMintFee();
    subscribeSavingsMaxDeposit();
    subscribeCurrentUserSavings();
    subscribeSavingsTvl();
    subscribeSavingsYield();
    subscribeManageTransactions();
    subscribeSavingsTransactions();
  }, []);

  return null;
};

export default HookSubscriber;
