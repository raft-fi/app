import { Decimal } from '@tempusfinance/decimal';

export interface ProtocolStats {
  collateralSupply: Decimal;
  debtSupply: Decimal;
  borrowingRate: Decimal;
  openPositions: number;
}
