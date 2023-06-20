import { UnderlyingCollateralToken } from '@raft-fi/sdk';
import { Decimal } from '@tempusfinance/decimal';
import { Nullable } from './Nullable';

export interface Position {
  underlyingCollateralToken: Nullable<UnderlyingCollateralToken>;
  collateralBalance: Decimal;
  debtBalance: Decimal;
}
