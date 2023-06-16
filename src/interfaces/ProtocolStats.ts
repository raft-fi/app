import { UnderlyingCollateralToken } from '@raft-fi/sdk';
import { Decimal } from '@tempusfinance/decimal';
import { Nullable } from './Nullable';

export interface ProtocolStats {
  collateralSupply: Record<UnderlyingCollateralToken, Nullable<Decimal>>;
  debtSupply: Record<UnderlyingCollateralToken, Nullable<Decimal>>;
}
