import { Decimal } from 'tempus-decimal';

export interface ProtocolStats {
  collateralSupply: Decimal;
  debtSupply: Decimal;
  borrowingRate: Decimal;
}
