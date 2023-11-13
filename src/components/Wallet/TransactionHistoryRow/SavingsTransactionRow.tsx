import { FC, useMemo } from 'react';
import { Link } from '@tempusfinance/common-ui';
import { R_TOKEN, SavingsTransaction } from '@raft-fi/sdk';
import { DecimalFormat } from '@tempusfinance/decimal';
import { R_TOKEN_UI_PRECISION } from '../../../constants';
import { useConfig } from '../../../hooks';
import { Icon, Typography } from '../../shared';

interface SavingsTransactionRow {
  transaction: SavingsTransaction;
}

const SavingsTransactionRow: FC<SavingsTransactionRow> = ({ transaction }) => {
  const config = useConfig();

  const amountFormatted = useMemo(() => {
    return DecimalFormat.format(transaction.amount, {
      style: 'currency',
      currency: R_TOKEN,
      fractionDigits: R_TOKEN_UI_PRECISION,
      lessThanFormat: true,
      pad: true,
    });
  }, [transaction.amount]);

  const transactionLabel = useMemo(() => {
    switch (transaction.type) {
      case 'DEPOSIT':
        return (
          <>
            <Typography variant="body2">Savings deposited&nbsp;</Typography>
            <Typography variant="body2" weight="semi-bold">
              {amountFormatted}
            </Typography>
          </>
        );

      case 'WITHDRAW':
        return (
          <>
            <Typography variant="body2">Savings withdrawn&nbsp;</Typography>
            <Typography variant="body2" weight="semi-bold">
              {amountFormatted}
            </Typography>
          </>
        );
    }
  }, [transaction.type, amountFormatted]);

  return (
    <Link href={`${config.blockExplorerUrl}/tx/${transaction.id}`} className="raft__wallet__popupTransaction">
      <Icon variant="external-link" size="small" />
      {transactionLabel}
    </Link>
  );
};
export { SavingsTransactionRow };
