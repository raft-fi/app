import { CollateralTotalSupply, DebtTotalSupply } from '@raft-fi/sdk';

export interface ProtocolStats {
  collateralSupply: CollateralTotalSupply[];
  debtSupply: DebtTotalSupply[];
}
