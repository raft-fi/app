import { FC, useMemo } from 'react';
import { Link } from 'tempus-ui';
import { PositionTransaction, R_TOKEN } from '@raft-fi/sdk';
import { DecimalFormat } from '@tempusfinance/decimal';
import { COLLATERAL_TOKEN_UI_PRECISION, R_TOKEN_UI_PRECISION } from '../../../constants';
import { useConfig } from '../../../hooks';
import { Icon, Typography } from '../../shared';

interface TransactionHistoryRowProps {
  transaction: PositionTransaction;
}

const TransactionHistoryRow: FC<TransactionHistoryRowProps> = ({ transaction }) => {
  const config = useConfig();

  const collateralChangeFormatted = useMemo(() => {
    return DecimalFormat.format(transaction.collateralChange.abs(), {
      style: 'currency',
      currency: transaction.collateralToken,
      fractionDigits: COLLATERAL_TOKEN_UI_PRECISION,
      lessThanFormat: true,
      pad: true,
    });
  }, [transaction.collateralChange, transaction.collateralToken]);

  const debtChangeFormatted = useMemo(() => {
    return DecimalFormat.format(transaction.debtChange.abs(), {
      style: 'currency',
      currency: R_TOKEN,
      fractionDigits: R_TOKEN_UI_PRECISION,
      lessThanFormat: true,
      pad: true,
    });
  }, [transaction.debtChange]);

  const transactionLabel = useMemo(() => {
    switch (transaction.type) {
      case 'ADJUST':
        // User only deposited more collateral
        if (transaction.collateralChange.gt(0) && transaction.debtChange.isZero()) {
          return (
            <>
              <Typography variant="body2">Deposited&nbsp;</Typography>
              <Typography variant="body2" weight="semi-bold">
                {collateralChangeFormatted}
              </Typography>
            </>
          );
        }
        // User only borrowed more debt (R)
        if (transaction.collateralChange.isZero() && transaction.debtChange.gt(0)) {
          return (
            <>
              <Typography variant="body2">Borrowed&nbsp;</Typography>
              <Typography variant="body2" weight="semi-bold">
                {debtChangeFormatted}
              </Typography>
            </>
          );
        }
        // User only withdrew collateral
        if (transaction.collateralChange.lt(0) && transaction.debtChange.isZero()) {
          return (
            <>
              <Typography variant="body2">Withdrew&nbsp;</Typography>
              <Typography variant="body2" weight="semi-bold">
                {collateralChangeFormatted}
              </Typography>
            </>
          );
        }
        // User only repaid debt (R)
        if (transaction.collateralChange.isZero() && transaction.debtChange.lt(0)) {
          return (
            <>
              <Typography variant="body2">Repaid&nbsp;</Typography>
              <Typography variant="body2" weight="semi-bold">
                {debtChangeFormatted}
              </Typography>
            </>
          );
        }

        // Both collateral and debt changed
        return (
          <>
            <Typography variant="body2">{transaction.debtChange.lt(0) ? 'Repaid' : 'Borrowed'}&nbsp;</Typography>
            <Typography variant="body2" weight="semi-bold">
              {debtChangeFormatted}
            </Typography>
            <Typography variant="body2">
              &nbsp;and {transaction.collateralChange.lt(0) ? 'withdrew' : 'deposited'}&nbsp;
            </Typography>
            <Typography variant="body2" weight="semi-bold">
              {collateralChangeFormatted}
            </Typography>
            <Typography variant="body2">&nbsp;collateral</Typography>
          </>
        );

      case 'OPEN':
        return (
          <>
            <Typography variant="body2">Borrowed&nbsp;</Typography>
            <Typography variant="body2" weight="semi-bold">
              {debtChangeFormatted}
            </Typography>
            <Typography variant="body2">&nbsp;with&nbsp;</Typography>
            <Typography variant="body2" weight="semi-bold">
              {collateralChangeFormatted}
            </Typography>
            <Typography variant="body2">&nbsp;collateral</Typography>
          </>
        );
      case 'CLOSE':
        return (
          <>
            <Typography variant="body2">Position closed with&nbsp;</Typography>
            <Typography variant="body2" weight="semi-bold">
              {debtChangeFormatted}
            </Typography>
            <Typography variant="body2">&nbsp;and&nbsp;</Typography>
            <Typography variant="body2" weight="semi-bold">
              {collateralChangeFormatted}
            </Typography>
            <Typography variant="body2">&nbsp;collateral</Typography>
          </>
        );
      case 'LIQUIDATION':
        return (
          <>
            <Typography variant="body2">Position liquidated with&nbsp;</Typography>
            <Typography variant="body2" weight="semi-bold">
              {debtChangeFormatted}
            </Typography>
            <Typography variant="body2">&nbsp;and&nbsp;</Typography>
            <Typography variant="body2" weight="semi-bold">
              {collateralChangeFormatted}
            </Typography>
            <Typography variant="body2">&nbsp;collateral</Typography>
          </>
        );
    }
  }, [
    transaction.collateralChange,
    transaction.debtChange,
    transaction.type,
    debtChangeFormatted,
    collateralChangeFormatted,
  ]);

  return (
    <Link href={`${config.blockExplorerUrl}/tx/${transaction.id}`} className="raft__wallet__popupTransaction">
      <Icon variant="external-link" size="small" />
      {transactionLabel}
    </Link>
  );
};
export { TransactionHistoryRow };
