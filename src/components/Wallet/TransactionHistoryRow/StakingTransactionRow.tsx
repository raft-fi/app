import { FC, useMemo } from 'react';
import { Link } from 'tempus-ui';
import { RAFT_BPT_TOKEN, RAFT_TOKEN, StakingTransaction } from '@raft-fi/sdk';
import { DecimalFormat } from '@tempusfinance/decimal';
import { COLLATERAL_TOKEN_UI_PRECISION } from '../../../constants';
import { useConfig } from '../../../hooks';
import { Icon, Typography } from '../../shared';
import { format } from 'date-fns';

interface StakingTransactionRowProp {
  transaction: StakingTransaction;
}

const StakingTransactionRow: FC<StakingTransactionRowProp> = ({ transaction }) => {
  const config = useConfig();

  const token = useMemo(() => {
    if (transaction.token) {
      return transaction.token;
    }

    return transaction.type === 'CLAIM' ? RAFT_TOKEN : RAFT_BPT_TOKEN;
  }, [transaction.token, transaction.type]);

  const amountFormatted = useMemo(() => {
    return DecimalFormat.format(transaction.amount, {
      style: 'currency',
      currency: token,
      fractionDigits: COLLATERAL_TOKEN_UI_PRECISION,
      lessThanFormat: true,
      pad: true,
    });
  }, [token, transaction.amount]);
  const unlockTimeFormatted = useMemo(
    () => (transaction.unlockTime ? format(transaction.unlockTime, 'dd MMMM yyyy') : null),
    [transaction.unlockTime],
  );

  const transactionLabel = useMemo(() => {
    switch (transaction.type) {
      case 'CREATE_LOCK':
        return (
          <>
            <Typography variant="body2">Staked&nbsp;</Typography>
            <Typography variant="body2" weight="semi-bold">
              {amountFormatted}
            </Typography>
            <Typography variant="body2">&nbsp;until&nbsp;</Typography>
            <Typography variant="body2" weight="semi-bold">
              {unlockTimeFormatted}
            </Typography>
          </>
        );
      case 'DEPOSIT_FOR':
      case 'INCREASE_LOCK_AMOUNT':
        return (
          <>
            <Typography variant="body2">Increased stake with&nbsp;</Typography>
            <Typography variant="body2" weight="semi-bold">
              {amountFormatted}
            </Typography>
          </>
        );
      case 'INCREASE_UNLOCK_TIME':
        return (
          <>
            <Typography variant="body2">Extended stake to&nbsp;</Typography>
            <Typography variant="body2" weight="semi-bold">
              {unlockTimeFormatted}
            </Typography>
          </>
        );
      case 'WITHDRAW':
        return (
          <>
            <Typography variant="body2">Withdrawn stake with&nbsp;</Typography>
            <Typography variant="body2" weight="semi-bold">
              {amountFormatted}
            </Typography>
          </>
        );
      case 'CLAIM':
        return (
          <>
            <Typography variant="body2">Claimed staking reward with&nbsp;</Typography>
            <Typography variant="body2" weight="semi-bold">
              {amountFormatted}
            </Typography>
          </>
        );
    }
  }, [transaction.type, amountFormatted, unlockTimeFormatted]);

  return (
    <Link href={`${config.blockExplorerUrl}/tx/${transaction.id}`} className="raft__wallet__popupTransaction">
      <Icon variant="external-link" size="small" />
      {transactionLabel}
    </Link>
  );
};
export { StakingTransactionRow };
