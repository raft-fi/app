import { FC, useMemo } from 'react';
import { Link } from '@tempusfinance/common-ui';
import { BridgeRequestTransaction, R_TOKEN } from '@raft-fi/sdk';
import { DecimalFormat } from '@tempusfinance/decimal';
import { CCIP_EXPLORER_URL, R_TOKEN_UI_PRECISION } from '../../../constants';
import { NETWORK_NAMES } from '../../../networks';
import { Icon, Typography } from '../../shared';

interface BridgeRequestTransactionRow {
  transaction: BridgeRequestTransaction;
}

const BridgeRequestTransactionRow: FC<BridgeRequestTransactionRow> = ({ transaction }) => {
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
    return (
      <>
        <Typography variant="body2">Request sent to bridge&nbsp;</Typography>
        <Typography variant="body2" weight="semi-bold">
          {amountFormatted}&nbsp;
        </Typography>
        <Typography variant="body2">from&nbsp;</Typography>
        <Typography variant="body2" weight="semi-bold">
          {NETWORK_NAMES[transaction.sourceChain]}&nbsp;
        </Typography>
        <Typography variant="body2">to&nbsp;</Typography>
        <Typography variant="body2" weight="semi-bold">
          {NETWORK_NAMES[transaction.destinationChain]}
        </Typography>
      </>
    );
  }, [amountFormatted, transaction.destinationChain, transaction.sourceChain]);

  return (
    <Link href={`${CCIP_EXPLORER_URL}/msg/${transaction.messageId}`} className="raft__wallet__popupTransaction">
      <Icon variant="external-link" size="small" />
      {transactionLabel}
    </Link>
  );
};
export { BridgeRequestTransactionRow };
