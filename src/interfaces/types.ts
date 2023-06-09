import { ERC20PermitSignatureStruct, Token } from '@raft-fi/sdk';
import { Nullable } from './Nullable';

export type TokenApprovedMap = {
  [token in Token]: Nullable<boolean>;
};

export type TokenSignatureMap = {
  [token in Token]: Nullable<ERC20PermitSignatureStruct>;
};
