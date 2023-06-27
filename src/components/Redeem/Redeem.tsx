import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { Decimal, DecimalFormat } from '@tempusfinance/decimal';
import { useConnectWallet } from '@web3-onboard/react';
import { R_TOKEN, UnderlyingCollateralToken } from '@raft-fi/sdk';
import { Link, TokenLogo } from 'tempus-ui';
import {
  useAppLoaded,
  useCalculateRedemptionRate,
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
import LoadingRedeem from '../LoadingRedeem';
import { SUPPORTED_COLLATERAL_TOKEN_SETTINGS, SUPPORTED_UNDERLYING_TOKENS } from '../../constants';

import './Redeem.scss';

const Redeem = () => {
  const [, connect] = useConnectWallet();

  const appLoaded = useAppLoaded();
  const tokenBalances = useTokenBalances();
  const tokenPrices = useTokenPrices();
  const wallet = useWallet();
  const { redeem, redeemStatus } = useRedeem();
  const { redemptionRateStatus, calculateRedemptionRate } = useCalculateRedemptionRate();

  const [selectedUnderlyingToken, setSelectedUnderlyingToken] = useState<UnderlyingCollateralToken>(
    SUPPORTED_UNDERLYING_TOKENS[0],
  );
  const [debtAmount, setDebtAmount] = useState<string>('');
  const [transactionState, setTransactionState] = useState<string>('default');

  const debtAmountDecimal = useMemo(() => Decimal.parse(debtAmount, 0), [debtAmount]);
  const selectedRedeemToken = SUPPORTED_COLLATERAL_TOKEN_SETTINGS[selectedUnderlyingToken].redeemToken;

  const rTokenValues = useMemo(
    () => getTokenValues(tokenBalances[R_TOKEN], tokenPrices[R_TOKEN], R_TOKEN),
    [tokenBalances, tokenPrices],
  );

  const collateralToReceive = useMemo(() => {
    const collateralBaseTokenPrice = tokenPrices[selectedUnderlyingToken];
    if (!collateralBaseTokenPrice || collateralBaseTokenPrice.isZero() || !redemptionRateStatus.result) {
      return null;
    }

    let feesMultiplier = Decimal.ONE.sub(redemptionRateStatus.result);
    if (feesMultiplier.lt(Decimal.ZERO)) {
      feesMultiplier = Decimal.ZERO;
    }

    return debtAmountDecimal.div(collateralBaseTokenPrice).mul(feesMultiplier);
  }, [debtAmountDecimal, redemptionRateStatus.result, selectedUnderlyingToken, tokenPrices]);

  // TODO: assumption is made here: underlying token is 1:1 to redeem token, not sure whether it's true in future
  const collateralToReceiveValues = useMemo(
    () => getTokenValues(collateralToReceive ?? Decimal.ZERO, tokenPrices[selectedRedeemToken], selectedRedeemToken),
    [collateralToReceive, selectedRedeemToken, tokenPrices],
  );

  const redemptionRateFormatted = useMemo(
    () =>
      DecimalFormat.format(redemptionRateStatus.result ?? Decimal.ZERO, {
        style: 'percentage',
        fractionDigits: 2,
        pad: true,
        approximate: true,
      }),
    [redemptionRateStatus.result],
  );

  const walletConnected = useMemo(() => Boolean(wallet), [wallet]);
  const hasInputFilled = useMemo(() => debtAmountDecimal && !debtAmountDecimal.isZero(), [debtAmountDecimal]);
  const hasEnoughRTokenBalance = useMemo(
    () => debtAmountDecimal && rTokenValues.amount && debtAmountDecimal.lte(rTokenValues.amount),
    [debtAmountDecimal, rTokenValues.amount],
  );
  const canRedeem = useMemo(() => hasInputFilled && hasEnoughRTokenBalance, [hasEnoughRTokenBalance, hasInputFilled]);

  const errorMessage = useMemo(() => {
    if (!hasEnoughRTokenBalance && walletConnected) {
      return 'Insufficient funds';
    }
  }, [hasEnoughRTokenBalance, walletConnected]);

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

  const calculateRedemptionRateByInput = useCallback(
    (amount: string) => {
      const decimal = Decimal.parse(amount, 0);
      calculateRedemptionRate({ underlyingCollateralToken: selectedUnderlyingToken, tokenAmount: decimal });
    },
    [calculateRedemptionRate, selectedUnderlyingToken],
  );

  const onRedeem = useCallback(() => {
    if (debtAmountDecimal.isZero()) {
      return;
    }

    redeem({
      debtAmount: debtAmountDecimal,
      txnId: uuid(),
      underlyingCollateralToken: selectedUnderlyingToken,
    });
  }, [debtAmountDecimal, redeem, selectedUnderlyingToken]);

  const onMaxAmountClick = useCallback(() => {
    setDebtAmount(rTokenValues.amount?.toString() || '');
  }, [rTokenValues.amount]);

  const handleDebtAmountChange = useCallback(
    (value: string) => {
      if (!value) {
        calculateRedemptionRateByInput('0');
      }

      setDebtAmount(value);
    },
    [calculateRedemptionRateByInput],
  );

  const handleUnderlyingTokenChange = useCallback(
    underlyingCollateralToken => {
      setSelectedUnderlyingToken(underlyingCollateralToken);
      calculateRedemptionRate({
        underlyingCollateralToken,
        tokenAmount: debtAmountDecimal,
      });
    },
    [calculateRedemptionRate, debtAmountDecimal],
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

  // set the default calculation for redemption fee
  useEffect(() => {
    calculateRedemptionRate({ underlyingCollateralToken: SUPPORTED_UNDERLYING_TOKENS[0], tokenAmount: Decimal.ZERO });
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
            onValueDebounceUpdate={calculateRedemptionRateByInput}
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
          <div className="raft__redeem__collateralDataCollateral">
            {SUPPORTED_UNDERLYING_TOKENS.map(underlyingToken => (
              <Button
                key={`button-${underlyingToken}`}
                variant="secondary"
                selected={underlyingToken === selectedUnderlyingToken}
                onClick={() => handleUnderlyingTokenChange(underlyingToken)}
              >
                <TokenLogo
                  type={`token-${SUPPORTED_COLLATERAL_TOKEN_SETTINGS[underlyingToken].redeemToken}`}
                  size={20}
                />
                <Typography variant="caption">
                  {SUPPORTED_COLLATERAL_TOKEN_SETTINGS[underlyingToken].redeemToken}
                </Typography>
              </Button>
            ))}
          </div>
          <div className="raft__redeem__collateralDataRow">
            <div className="raft__redeem__collateralDataRowData">
              {redemptionRateStatus.pending && <Loading size={22} color="primary" />}
              {!redemptionRateStatus.pending && collateralToReceiveValues.amountFormattedApproximate && (
                <ValueLabel
                  value={collateralToReceiveValues.amountFormattedApproximate}
                  valueSize="body"
                  tickerSize="caption"
                />
              )}
              {!redemptionRateStatus.pending && collateralToReceiveValues.valueFormattedApproximate && (
                <div className="raft__redeem__collateralDataRowValue">
                  <Typography variant="body" color="text-secondary">
                    (
                  </Typography>
                  <ValueLabel
                    value={collateralToReceiveValues.valueFormattedApproximate}
                    tickerSize="caption"
                    valueSize="body"
                    color="text-secondary"
                  />
                  <Typography variant="body" color="text-secondary">
                    )
                  </Typography>
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
          <div className="raft__redeem__collateralDataRow">
            <div className="raft__redeem__collateralDataRowData">
              {redemptionRateStatus.pending && <Loading size={22} color="primary" />}
              {!redemptionRateStatus.pending && redemptionRateFormatted && (
                <ValueLabel value={redemptionRateFormatted} valueSize="body" tickerSize="caption" />
              )}
            </div>
          </div>
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
