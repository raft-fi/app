import { FC, memo, useEffect } from 'react';
import {
  subscribeENS,
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
  subscribeRaftToken,
  subscribeRaftTokenAnnualGiveAway,
  subscribeUserVeRaftBalance,
  subscribeUserRaftBptBalance,
  subscribeStakeBptForVeRaftStatus,
  subscribeManageSavingsStatus,
  subscribeSavingsMaxDeposit,
  subscribeCurrentUserSavings,
  subscribeManageTransactions,
  subscribeSavingsTransactions,
  subscribeBridgeTokensStatus,
  subscribeWaitForBridgeStatus,
} from '../../hooks';
import { subscribeWithdrawRaftBptStatus } from '../../hooks/useWithdrawRaftBpt';

const HookSubscriber: FC = () => {
  // to keep at least one subscriber of the stream insides the state hooks

  // subscribe for the steam$ of the polling hooks
  useEffect(() => {
    subscribeAppLoaded();
    subscribeENS();
    subscribeTokenPrices();
    subscribeTokenBalances();
    subscribeEIP1193Provider();
    subscribeTransactionHistory();
    subscribeTokenAllowances();
    subscribeLeverageTokenAllowances();
    subscribeTokenWhitelists();
    subscribeLeverageTokenWhitelists();
    subscribeCollateralBorrowingRates();
    subscribeCollateralConversionRates();
    subscribePosition();
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
    subscribeRaftToken();
    subscribeRaftTokenAnnualGiveAway();
    subscribeUserVeRaftBalance();
    subscribeUserRaftBptBalance();
    subscribeStakeBptForVeRaftStatus();
    subscribeWithdrawRaftBptStatus();
    subscribeSavingsMaxDeposit();
    subscribeCurrentUserSavings();
    subscribeManageTransactions();
    subscribeSavingsTransactions();
    subscribeWaitForBridgeStatus();
  }, []);

  return null;
};

// TODO: remove this HookSubscriber later
export default memo(HookSubscriber);
