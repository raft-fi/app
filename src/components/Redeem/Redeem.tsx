import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { Decimal, DecimalFormat } from '@tempusfinance/decimal';
import { useConnectWallet } from '@web3-onboard/react';
import { Link, TokenLogo } from 'tempus-ui';
import { COLLATERAL_BASE_TOKEN } from '../../constants';
import { useCollateralRedemptionRate, useRedeem, useTokenPrices, useWallet } from '../../hooks';
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

const Redeem = () => {
  const [, connect] = useConnectWallet();

  const tokenPrices = useTokenPrices();
  const redemptionRate = useCollateralRedemptionRate();
  const wallet = useWallet();
  const { redeem, redeemStatus } = useRedeem();

  const [debtAmount, setDebtAmount] = useState<string>('');
  const [transactionState, setTransactionState] = useState<string>('default');

  const debtAmountDecimal = useMemo(() => {
    return Decimal.parse(debtAmount, 0);
  }, [debtAmount]);

  const walletConnected = useMemo(() => Boolean(wallet), [wallet]);

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

  const onRedeem = useCallback(() => {
    redeem({
      debtAmount: debtAmountDecimal,
      txnId: uuid(),
      underlyingCollateralToken: COLLATERAL_BASE_TOKEN,
    });
  }, [debtAmountDecimal, redeem]);

  const onConnectWallet = useCallback(() => {
    connect();
  }, [connect]);

  const hasInputFilled = useMemo(() => debtAmountDecimal && !debtAmountDecimal.isZero(), [debtAmountDecimal]);

  // TODO - Handle all possible errors and update accordingly
  const canRedeem = useMemo(() => hasInputFilled, [hasInputFilled]);

  const buttonDisabled = useMemo(
    () => transactionState === 'loading' || (walletConnected && !canRedeem),
    [canRedeem, transactionState, walletConnected],
  );

  const buttonLabel = useMemo(() => {
    if (!walletConnected) {
      return 'Connect wallet';
    }

    return 'Redeem'; // TODO - Handle all possible errors and update label accordingly
  }, [walletConnected]);

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
    });
  }, [redemptionRate]);

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
            onValueUpdate={setDebtAmount}
          />
        </div>
        <div className="raft__redeem__warningContainer">
          <WarningBox text="Warning: Redemption of R at peg will result in significant financial loss." />
        </div>

        <div className="raft__redeem__collateralData">
          <div className="raft__redeem__collateralDataTitle">
            <Typography variant="overline">COLLATERAL TO RECEIVE</Typography>
            <TooltipWrapper
              tooltipContent={
                <Tooltip className="raft__redeem__infoTooltip">
                  <Typography variant="body2">
                    Summary of your position after the transaction is executed.{' '}
                    <Link href="https://docs.raft.fi/how-it-works/borrowing">
                      docs <Icon variant="external-link" size={10} />
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
              {collateralToReceiveValues.amountFormatted && (
                <ValueLabel value={collateralToReceiveValues.amountFormatted} valueSize="body" tickerSize="caption" />
              )}
              {collateralToReceiveValues.valueFormatted && (
                <div className="raft__redeem__collateralDataRowValue">
                  (
                  <ValueLabel
                    value={`~${collateralToReceiveValues.valueFormatted}`}
                    tickerSize="caption"
                    valueSize="body"
                    color="text-secondary"
                  />
                  )
                </div>
              )}
            </div>
          </div>

          <div className="raft__redeem__collateralDataTitle">
            <Typography variant="overline">PROTOCOL FEES</Typography>
            <TooltipWrapper
              tooltipContent={
                <Tooltip className="raft__redeem__infoTooltip">
                  <Typography variant="body2">
                    Summary of your position after the transaction is executed.{' '}
                    <Link href="https://docs.raft.fi/how-it-works/borrowing">
                      docs <Icon variant="external-link" size={10} />
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
                <ValueLabel value={redemptionRateFormatted} valueSize="body" tickerSize="caption" />
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
// 0.00000333
