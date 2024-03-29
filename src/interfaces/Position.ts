import { UnderlyingCollateralToken, VaultVersion } from '@raft-fi/sdk';
import { Decimal } from '@tempusfinance/decimal';
import { Nullable } from './Nullable';

export interface Position {
  ownerAddress: string;
  underlyingCollateralToken: Nullable<UnderlyingCollateralToken>;
  hasPosition: boolean;
  hasLeveragePosition: boolean;
  collateralBalance: Decimal;
  debtBalance: Decimal;
  netBalance: Nullable<Decimal>;
  vaultVersion: VaultVersion;
}

export interface LeveragePosition extends Position {
  effectiveLeverage: Decimal;
}
