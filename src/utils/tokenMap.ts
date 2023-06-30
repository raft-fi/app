import { Token } from '@raft-fi/sdk';
import { Decimal } from '@tempusfinance/decimal';
import { Nullable, TokenDecimalMap, TokenGenericMap } from '../interfaces';

export const getDecimalFromTokenMap = <T extends Token = Token>(
  map: Nullable<TokenDecimalMap<T>>,
  token: Nullable<T>,
): Nullable<Decimal> => {
  if (!map || !token) {
    return null;
  }

  return map[token] ?? null;
};

export const getDefaultTokenMap = <T extends Token = Token, V = object>(
  tokens: readonly T[],
  defaultValue: V,
): TokenGenericMap<T, V> =>
  tokens.reduce(
    (map, token) => ({
      ...map,
      [token]: defaultValue,
    }),
    {} as TokenGenericMap<T, V>,
  );

export const getNullTokenMap = <T extends Token = Token>(tokens: readonly T[]) =>
  getDefaultTokenMap<T, null>(tokens, null);
