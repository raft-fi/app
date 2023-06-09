import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { Decimal, DecimalFormat } from '@tempusfinance/decimal';
import { useConnectWallet } from '@web3-onboard/react';
import { Protocol, R_TOKEN } from '@raft-fi/sdk';
import { Link, TokenLogo } from 'tempus-ui';
import { COLLATERAL_BASE_TOKEN } from '../../constants';
import {
  useAppLoaded,
  useProtocolStats,
  useProvider,
  useRedeem,
  useTokenBalances,
  useTokenPrices,
  useWallet,
} from '../../hooks';
import { getTokenValues } from '../../utils';
import {
  Button,
  CurrencyInput,
  Icon,
  Loading,
  Tooltip,
  TooltipWrapper,
  Typography,
  ValueLabel,
  WarningBox,
} from '../shared';

import './Redeem.scss';
import LoadingRedeem from '../LoadingRedeem';

const Redeem = () => {
  const [, connect] = useConnectWallet();

  const provider = useProvider();
  const protocolStats = useProtocolStats();
  const appLoaded = useAppLoaded();
  const tokenBalances = useTokenBalances();
  const tokenPrices = useTokenPrices();
  const wallet = useWallet();
  const { redeem, redeemStatus } = useRedeem();

  const [redemptionRate, setRedemptionRate] = useState<string>('');
  const [redemptionRateLoading, setRedemptionRateLoading] = useState<boolean>(false);
  const [debtAmount, setDebtAmount] = useState<string>('');
  const [transactionState, setTransactionState] = useState<string>('default');

  const debtAmountDecimal = useMemo(() => {
    return Decimal.parse(debtAmount, 0);
  }, [debtAmount]);

  const walletConnected = useMemo(() => Boolean(wallet), [wallet]);

  const rTokenValues = useMemo(() => {
    return getTokenValues(tokenBalances[R_TOKEN], tokenPrices[R_TOKEN], R_TOKEN);
  }, [tokenBalances, tokenPrices]);

  const hasInputFilled = useMemo(() => debtAmountDecimal && !debtAmountDecimal.isZero(), [debtAmountDecimal]);

  const hasEnoughRTokenBalance = useMemo(() => {
    if (!debtAmountDecimal || !rTokenValues.amount) {
      return false;
    }

    return debtAmountDecimal.lte(rTokenValues.amount);
  }, [debtAmountDecimal, rTokenValues.amount]);

  const canRedeem = useMemo(() => {
    return hasInputFilled && hasEnoughRTokenBalance;
  }, [hasEnoughRTokenBalance, hasInputFilled]);

  const errorMessage = useMemo(() => {
    if (!hasEnoughRTokenBalance && walletConnected) {
      return 'Insufficient funds';
    }
  }, [hasEnoughRTokenBalance, walletConnected]);

  const collateralToReceive = useMemo(() => {
    const collateralBaseTokenPrice = tokenPrices[COLLATERAL_BASE_TOKEN];
    if (!collateralBaseTokenPrice || collateralBaseTokenPrice.isZero() || !redemptionRate) {
      return null;
    }

    let feesMultiplier = Decimal.ONE.sub(redemptionRate);
    if (feesMultiplier.lt(Decimal.ZERO)) {
      feesMultiplier = Decimal.ZERO;
    }

    return debtAmountDecimal.div(collateralBaseTokenPrice).mul(feesMultiplier);
  }, [debtAmountDecimal, redemptionRate, tokenPrices]);

  const collateralToReceiveValues = useMemo(() => {
    return getTokenValues(collateralToReceive, tokenPrices[COLLATERAL_BASE_TOKEN], COLLATERAL_BASE_TOKEN);
  }, [collateralToReceive, tokenPrices]);

  const redemptionRateFormatted = useMemo(() => {
    if (!redemptionRate) {
      return null;
    }

    return DecimalFormat.format(redemptionRate, {
      style: 'percentage',
      fractionDigits: 2,
      pad: true,
      approximate: true,
    });
  }, [redemptionRate]);

  const buttonDisabled = useMemo(
    () => transactionState === 'loading' || (walletConnected && !canRedeem),
    [canRedeem, transactionState, walletConnected],
  );

  const buttonLabel = useMemo(() => {
    if (!walletConnected) {
      return 'Connect wallet';
    }

    if (!hasEnoughRTokenBalance) {
      return 'Insufficient funds';
    }

    if (transactionState === 'loading') {
      return 'Executing';
    }

    return 'Redeem'; // TODO - Handle all possible errors and update label accordingly
  }, [hasEnoughRTokenBalance, transactionState, walletConnected]);

  const onConnectWallet = useCallback(() => {
    connect();
  }, [connect]);

  const onRedeem = useCallback(() => {
    if (debtAmountDecimal.isZero()) {
      return;
    }

    redeem({
      debtAmount: debtAmountDecimal,
      txnId: uuid(),
      underlyingCollateralToken: COLLATERAL_BASE_TOKEN,
    });
  }, [debtAmountDecimal, redeem]);

  const onMaxAmountClick = useCallback(() => {
    setDebtAmount(rTokenValues.amount?.toString() || '');
  }, [rTokenValues.amount]);

  const calculateRedemptionRate = useCallback(
    async (value: string) => {
      const collateralPrice = tokenPrices[COLLATERAL_BASE_TOKEN];

      if (!protocolStats || !collateralPrice) {
        return;
      }

      const protocol = Protocol.getInstance(provider);

      const result = await protocol.fetchRedemptionRate(
        COLLATERAL_BASE_TOKEN,
        Decimal.parse(value, 0),
        collateralPrice,
        protocolStats.debtSupply,
      );

      setRedemptionRate(result.toString());

      setRedemptionRateLoading(false);
    },
    [protocolStats, provider, tokenPrices],
  );

  const handleDebtAmountChange = useCallback(
    (value: string) => {
      setRedemptionRateLoading(true);

      if (!value) {
        calculateRedemptionRate('0');
      }

      setDebtAmount(value);
    },
    [calculateRedemptionRate],
  );

  /**
   * Update action button state based on current redeem request status
   */
  useEffect(() => {
    if (!redeemStatus) {
      return;
    }

    if (redeemStatus.pending) {
      setTransactionState('loading');
    } else if (redeemStatus.success) {
      setTransactionState('success');
    } else {
      setTransactionState('default');
    }
  }, [redeemStatus]);

  useEffect(() => {
    calculateRedemptionRate('0');
  }, [calculateRedemptionRate]);

  if (!appLoaded) {
    return (
      <div className="raft__redeem__container">
        <LoadingRedeem />
      </div>
    );
  }

  return (
    <div className="raft__redeem__container">
      <div className="raft__redeem">
        <Typography variant="heading2" weight="medium">
          Redeem
        </Typography>
        <div className="raft__redeem__input">
          <CurrencyInput
            label="AMOUNT TO REDEEM"
            precision={18}
            selectedToken="R"
            tokens={['R']}
            value={debtAmount}
            onValueUpdate={handleDebtAmountChange}
            onValueDebounceUpdate={calculateRedemptionRate}
            maxAmount={rTokenValues.amount}
            maxAmountFormatted={rTokenValues.amountFormatted || ''}
            onMaxAmountClick={onMaxAmountClick}
            error={!hasEnoughRTokenBalance && walletConnected}
            errorMsg={errorMessage}
          />
        </div>
        <div className="raft__redeem__warningContainer">
          <WarningBox text="Redemption of R at peg will result in significant financial loss." />
        </div>

        <div className="raft__redeem__collateralData">
          <div className="raft__redeem__collateralDataTitle">
            <Typography variant="overline">COLLATERAL TO RECEIVE</Typography>
            <TooltipWrapper
              tooltipContent={
                <Tooltip className="raft__redeem__infoTooltip">
                  <Typography variant="body2">
                    The amount of collateral that will be received after redeeming. Read the docs for more information.{' '}
                    <Link href="https://docs.raft.fi/how-it-works/returning/redemption">
                      Docs <Icon variant="external-link" size={10} />
                    </Link>
                  </Typography>
                </Tooltip>
              }
              placement="top"
            >
              <Icon variant="info" size="tiny" />
            </TooltipWrapper>
          </div>
          <div className="raft__redeem__collateralDataRow">
            <div className="raft__redeem__collateralDataRowData">
              <TokenLogo type={`token-${COLLATERAL_BASE_TOKEN}`} size={20} />
              {collateralToReceiveValues.amountFormattedApproximate && (
                <ValueLabel
                  value={collateralToReceiveValues.amountFormattedApproximate}
                  valueSize="body"
                  tickerSize="caption"
                />
              )}
              {collateralToReceiveValues.valueFormattedApproximate && (
                <div className="raft__redeem__collateralDataRowValue">
                  <ValueLabel
                    value={`(${collateralToReceiveValues.valueFormattedApproximate})`}
                    tickerSize="caption"
                    valueSize="body"
                    color="text-secondary"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="raft__redeem__collateralDataTitle">
            <Typography variant="overline">REDEMPTION FEE</Typography>
            {/* TODO - Update tooltip content */}
            <TooltipWrapper
              tooltipContent={
                <Tooltip className="raft__redeem__infoTooltip">
                  <Typography variant="body2">
                    Redemption fee associated with your transaction. Read the docs for more information.{' '}
                    <Link href="https://docs.raft.fi/how-it-works/returning/redemption">
                      Docs <Icon variant="external-link" size={10} />
                    </Link>
                  </Typography>
                </Tooltip>
              }
              placement="top"
            >
              <Icon variant="info" size="tiny" />
            </TooltipWrapper>
          </div>
          {redemptionRateFormatted && (
            <div className="raft__redeem__collateralDataRow">
              <div className="raft__redeem__collateralDataRowData">
                {redemptionRateLoading ? (
                  <Loading size={22} color="primary" />
                ) : (
                  <ValueLabel value={redemptionRateFormatted} valueSize="body" tickerSize="caption" />
                )}
              </div>
            </div>
          )}
        </div>

        <div className="raft__redeem__action">
          <Button
            variant="primary"
            size="large"
            onClick={walletConnected ? onRedeem : onConnectWallet}
            disabled={buttonDisabled}
          >
            {transactionState === 'loading' && <Loading />}
            <Typography variant="button-label" color="text-primary-inverted">
              {buttonLabel}
            </Typography>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default memo(Redeem);
