import { ERC20PermitSignatureStruct, Token } from '@raft-fi/sdk';
import { Decimal } from '@tempusfinance/decimal';
import { SUPPORTED_COLLATERAL_TOKENS } from '../constants';
import { Nullable } from './Nullable';

export type TokenGenericMap<T extends Token = Token, V = object> = {
  [token in T]: Nullable<V>;
};

export type TokenApprovedMap = TokenGenericMap<Token, boolean>;

export type TokenSignatureMap = TokenGenericMap<Token, ERC20PermitSignatureStruct>;

export type TokenDecimalMap<T extends Token = Token> = TokenGenericMap<T, Decimal>;

export type SupportedCollateralToken = (typeof SUPPORTED_COLLATERAL_TOKENS)[number];
