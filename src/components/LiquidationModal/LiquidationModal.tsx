import { PositionTransaction, R_TOKEN } from '@raft-fi/sdk';
import { Decimal, DecimalFormat } from '@tempusfinance/decimal';
import { FC, useCallback, useMemo, useState } from 'react';
import { Link } from '@tempusfinance/common-ui';
import { COLLATERAL_TOKEN_UI_PRECISION, R_TOKEN_UI_PRECISION } from '../../constants';
import { useConfig } from '../../hooks';
import { Button, Icon, ModalWrapper, Typography, ValuesBox } from '../shared';

import './LiquidationModal.scss';

const LOCAL_STORAGE_KEY = 'RAFT_LIQUIDATION_${WALLET}_${TXN}';

const isReadFromLocalStorage = (walletAddress: string, txnId: string) => {
  const key = LOCAL_STORAGE_KEY.replace('${WALLET}', walletAddress).replace('${TXN}', txnId);
  const flag = window.localStorage.getItem(key);
  return !flag;
};

const setReadFromLocalStorage = (walletAddress: string, txnId: string) => {
  const key = LOCAL_STORAGE_KEY.replace('${WALLET}', walletAddress).replace('${TXN}', txnId);
  window.localStorage.setItem(key, '1');
};

interface LiquidationModalProps {
  walletAddress: string;
  liquidationTransaction: PositionTransaction;
}

const LiquidationModal: FC<LiquidationModalProps> = ({ walletAddress, liquidationTransaction }) => {
  const config = useConfig();

  const isRead = isReadFromLocalStorage(walletAddress, liquidationTransaction.id);
  const [open, setOpen] = useState<boolean>(isRead);

  const onClose = useCallback(() => {
    setOpen(false);
    setReadFromLocalStorage(walletAddress, liquidationTransaction.id);
  }, [liquidationTransaction.id, walletAddress]);

  const timestampFormatted = useMemo(
    () =>
      new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(
        liquidationTransaction.timestamp,
      ),
    [liquidationTransaction.timestamp],
  );
  const fromCollateralFormatted = useMemo(
    () =>
      DecimalFormat.format(liquidationTransaction.underlyingCollateralChange.abs(), {
        style: 'currency',
        currency: liquidationTransaction.underlyingCollateralToken,
        fractionDigits: COLLATERAL_TOKEN_UI_PRECISION,
      }),
    [liquidationTransaction.underlyingCollateralChange, liquidationTransaction.underlyingCollateralToken],
  );
  const fromDebtFormatted = useMemo(
    () =>
      DecimalFormat.format(liquidationTransaction.debtChange.abs(), {
        style: 'currency',
        currency: R_TOKEN,
        fractionDigits: R_TOKEN_UI_PRECISION,
      }),
    [liquidationTransaction.debtChange],
  );
  const toCollateralFormatted = useMemo(
    () =>
      DecimalFormat.format(Decimal.ZERO, {
        style: 'currency',
        currency: liquidationTransaction.underlyingCollateralToken,
        fractionDigits: COLLATERAL_TOKEN_UI_PRECISION,
      }),
    [liquidationTransaction.underlyingCollateralToken],
  );
  const toDebtFormatted = useMemo(
    () =>
      DecimalFormat.format(Decimal.ZERO, {
        style: 'currency',
        currency: R_TOKEN,
        fractionDigits: R_TOKEN_UI_PRECISION,
      }),
    [],
  );

  const infoEntries = useMemo(
    () => [
      {
        id: 'collateral',
        label: 'Collateral',
        value: fromCollateralFormatted,
        newValue: toCollateralFormatted,
      },
      {
        id: 'debt',
        label: 'Debt',
        value: fromDebtFormatted,
        newValue: toDebtFormatted,
      },
    ],
    [fromCollateralFormatted, fromDebtFormatted, toCollateralFormatted, toDebtFormatted],
  );

  return (
    <ModalWrapper open={open} onClose={onClose}>
      <div className="raft__liquidationModal">
        <div className="raft__liquidationModal__icon">
          <Icon variant="position-changed" size={142} />
        </div>
        <div className="raft__liquidationModal__title">
          <Typography variant="heading3">Your Position has changed</Typography>
        </div>
        <div className="raft__liquidationModal__subtitle">
          <Typography variant="heading2">{timestampFormatted}</Typography>
        </div>
        <div className="raft__liquidationModal__info">
          <Typography className="raft__liquidationModal__info__title" variant="body">
            Your Position
          </Typography>
          <ValuesBox values={infoEntries} />
        </div>
        <div className="raft__liquidationModal__explorerLink">
          <Typography variant="caption">View transaction on&nbsp;</Typography>
          <Link href={`${config.blockExplorerUrl}/tx/${liquidationTransaction.id}`}>
            <Typography variant="caption" color="text-accent">
              Etherscan
            </Typography>
          </Link>
          &nbsp;
          <Icon variant="external-link" size={10} />
        </div>
        <div className="raft__liquidationModal__actions">
          <div className="raft__liquidationModal__action">
            <Button variant="primary" size="large" text="Got it!" onClick={onClose} />
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};
export default LiquidationModal;
