import { PositionTransaction, R_TOKEN } from '@raft-fi/sdk';
import { Decimal, DecimalFormat } from '@tempusfinance/decimal';
import { FC, useCallback, useMemo, useState } from 'react';
import { Link } from 'tempus-ui';
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
      DecimalFormat.format(liquidationTransaction.collateralChange.abs(), {
        style: 'currency',
        currency: liquidationTransaction.collateralToken,
        fractionDigits: COLLATERAL_TOKEN_UI_PRECISION,
      }),
    [liquidationTransaction.collateralChange, liquidationTransaction.collateralToken],
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
        currency: liquidationTransaction.collateralToken,
        fractionDigits: COLLATERAL_TOKEN_UI_PRECISION,
      }),
    [liquidationTransaction.collateralToken],
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
          <Typography variant="heading1">Your Position has changed</Typography>
        </div>
        <div className="raft__liquidationModal__subtitle">
          <Typography variant="heading2">{timestampFormatted}</Typography>
        </div>
        <div className="raft__liquidationModal__info">
          <Typography className="raft__liquidationModal__info__title" variant="body-primary">
            Your Position
          </Typography>
          <ValuesBox values={infoEntries} />
        </div>
        <div className="raft__liquidationModal__explorerLink">
          <Typography variant="body-secondary">View transaction on&nbsp;</Typography>
          <Link href={`${config.blockExplorerUrl}/tx/${liquidationTransaction.id}`}>
            <Typography variant="body-secondary" color="text-accent">
              Etherscan
            </Typography>
          </Link>
          &nbsp;
          <Icon variant="external-link" size={10} />
        </div>
        <div className="raft__liquidationModal__actions">
          <div className="raft__liquidationModal__action">
            <Button variant="primary" text="Got it!" onClick={onClose} />
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};
export default LiquidationModal;
