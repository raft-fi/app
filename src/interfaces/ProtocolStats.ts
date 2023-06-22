import { UnderlyingCollateralToken } from '@raft-fi/sdk';
import { TokenDecimalMap } from './types';

export interface ProtocolStats {
  collateralSupply: TokenDecimalMap<UnderlyingCollateralToken>;
  debtSupply: TokenDecimalMap<UnderlyingCollateralToken>;
}
