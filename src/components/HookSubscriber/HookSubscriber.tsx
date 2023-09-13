import { FC, memo, useEffect } from 'react';
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
  subscribeWaitForBridgeStatus,
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
    subscribeWaitForBridgeStatus();
  }, []);

  return null;
};

// TODO: remove this HookSubscriber later
export default memo(HookSubscriber);
