import { Token } from '@raft-fi/sdk';
import { Decimal } from '@tempusfinance/decimal';
import { Nullable, TokenDecimalMap } from '../interfaces';

export const getDecimalFromTokenMap = <T extends Token = Token>(
  map: Nullable<TokenDecimalMap<T>>,
  token: Nullable<T>,
): Nullable<Decimal> => {
  if (!map || !token) {
    return null;
  }

  return map[token] ?? null;
};
