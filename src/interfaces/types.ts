import { ERC20PermitSignatureStruct, Token } from '@raft-fi/sdk';
import { Decimal } from '@tempusfinance/decimal';
import { SUPPORTED_COLLATERAL_TOKENS, SUPPORTED_UNDERLYING_TOKENS } from '../constants';
import { Nullable } from './Nullable';

export type TokenGenericMap<T extends Token = Token, V = object> = {
  [token in T]: V;
};

export type TokenApprovedMap = TokenGenericMap<Token, Nullable<boolean>>;

export type TokenSignatureMap = TokenGenericMap<Token, Nullable<ERC20PermitSignatureStruct>>;

export type TokenDecimalMap<T extends Token = Token> = TokenGenericMap<T, Nullable<Decimal>>;

export type SupportedCollateralToken = (typeof SUPPORTED_COLLATERAL_TOKENS)[number];
export type SupportedUnderlyingCollateralToken = (typeof SUPPORTED_UNDERLYING_TOKENS)[number];
