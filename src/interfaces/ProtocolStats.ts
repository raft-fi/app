import { Decimal } from '@tempusfinance/decimal';
import { InterestRateVault, UnderlyingCollateralToken } from '@raft-fi/sdk';
import { TokenDecimalMap } from './types';

export interface ProtocolStats {
  collateralSupply: TokenDecimalMap<UnderlyingCollateralToken>;
  debtSupply: TokenDecimalMap<UnderlyingCollateralToken>;
  interestRate: TokenDecimalMap<InterestRateVault>;
  totalRSupply: Decimal;
  psmTvlToken: Decimal;
  psmTvlFiat: Decimal;
}
