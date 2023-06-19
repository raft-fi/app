import { ERC20PermitSignatureStruct, Token } from '@raft-fi/sdk';
import { SUPPORTED_COLLATERAL_TOKENS } from '../constants';
import { Nullable } from './Nullable';

export type TokenApprovedMap = {
  [token in Token]: Nullable<boolean>;
};

export type TokenSignatureMap = {
  [token in Token]: Nullable<ERC20PermitSignatureStruct>;
};

export type SupportedCollateralTokens = (typeof SUPPORTED_COLLATERAL_TOKENS)[number];
