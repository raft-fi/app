import { PositionTransaction, SavingsTransaction, StakingTransaction } from '@raft-fi/sdk';
import { memo } from 'react';
import { HistoryTransaction, useTransactionHistory } from '../../hooks';
import { Typography } from '../shared';
import {
  BridgeRequestTransactionRow,
  ManageTransactionRow,
  SavingsTransactionRow,
  StakingTransactionRow,
} from './TransactionHistoryRow';

const isSavingsTransaction = (transaction: HistoryTransaction): transaction is SavingsTransaction => {
  return transaction.type === 'DEPOSIT' || transaction.type === 'WITHDRAW';
};

const isStakingTransaction = (transaction: HistoryTransaction): transaction is StakingTransaction => {
  return ['DEPOSIT_FOR', 'CREATE_LOCK', 'INCREASE_LOCK_AMOUNT', 'INCREASE_UNLOCK_TIME', 'WITHDRAW', 'CLAIM'].includes(
    transaction.type,
  );
};

const isManageTransaction = (transaction: HistoryTransaction): transaction is PositionTransaction => {
  return (
    transaction.type === 'ADJUST' ||
    transaction.type === 'CLOSE' ||
    transaction.type === 'OPEN' ||
    transaction.type === 'LIQUIDATION'
  );
};

const TransactionHistory = () => {
  const transactionHistory = useTransactionHistory();

  return (
    <div className="raft__wallet_popupTransactions">
      <div className="raft__wallet__popupTransactionsContainer">
        {transactionHistory?.length ? (
          transactionHistory.map(transaction => {
            if (isSavingsTransaction(transaction)) {
              return <SavingsTransactionRow key={transaction.id} transaction={transaction} />;
            }
            if (isStakingTransaction(transaction)) {
              return <StakingTransactionRow key={transaction.id} transaction={transaction} />;
            }
            if (isManageTransaction(transaction)) {
              return <ManageTransactionRow key={transaction.id} transaction={transaction} />;
            }
            return <BridgeRequestTransactionRow key={transaction.id} transaction={transaction} />;
          })
        ) : (
          <Typography
            className="raft__wallet__popupTransactionsContainer__empty"
            variant="body"
            weight="medium"
            color="text-secondary"
          >
            No transactions
          </Typography>
        )}
      </div>
    </div>
  );
};

export default memo(TransactionHistory);
