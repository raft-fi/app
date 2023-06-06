import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { Decimal } from '@tempusfinance/decimal';
import { Link, TokenLogo } from 'tempus-ui';
import { COLLATERAL_BASE_TOKEN } from '../../constants';
import { useRedeem, useTokenPrices } from '../../hooks';
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
import { getTokenValues } from '../../utils';
import { R_TOKEN } from '@raft-fi/sdk';

const Redeem = () => {
  const { redeem, redeemStatus } = useRedeem();
  const tokenPrices = useTokenPrices();

  const [debtAmount, setDebtAmount] = useState<string>('');
  const [transactionState, setTransactionState] = useState<string>('default');

  const debtAmountDecimal = useMemo(() => {
    return Decimal.parse(debtAmount, 0);
  }, [debtAmount]);

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

  const buttonDisabled = useMemo(() => {
    // TODO - Check if there are any other cases where button should be disabled
    return debtAmountDecimal.isZero() || transactionState === 'loading';
  }, [debtAmountDecimal, transactionState]);

  const buttonLabel = useMemo(() => {
    return 'Redeem'; // TODO - Handle all possible errors and update label accordingly
  }, []);

  const debtAmountValues = useMemo(() => {
    return getTokenValues(debtAmountDecimal, tokenPrices[R_TOKEN], R_TOKEN);
  }, [debtAmountDecimal, tokenPrices]);

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
              <ValueLabel value="0.0000 wstETH" valueSize="body" tickerSize="caption" />
              <div className="raft__redeem__collateralDataRowValue">
                (<ValueLabel value="~$0.00" tickerSize="caption" valueSize="body" color="text-secondary" />)
              </div>
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
          <div className="raft__redeem__collateralDataRow">
            <div className="raft__redeem__collateralDataRowData">
              <ValueLabel value="1.50%" valueSize="body" tickerSize="caption" />
            </div>
          </div>
        </div>

        <div className="raft__redeem__action">
          <Button variant="primary" size="large" onClick={onRedeem} disabled={buttonDisabled}>
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
