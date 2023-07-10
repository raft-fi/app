import { UnderlyingCollateralToken } from '@raft-fi/sdk';
import { Decimal } from '@tempusfinance/decimal';
import { Nullable } from './Nullable';

export interface Position {
  ownerAddress: string;
  underlyingCollateralToken: Nullable<UnderlyingCollateralToken>;
  collateralBalance: Decimal;
  debtBalance: Decimal;
  principalCollateralBalance: Nullable<Decimal>;
}
