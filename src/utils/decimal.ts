import { R_TOKEN, Token } from '@raft-fi/sdk';
import { DecimalFormat, Numberish } from '@tempusfinance/decimal';
import {
  COLLATERAL_TOKEN_UI_PRECISION,
  MULTIPLIER_UI_PRECISION,
  R_TOKEN_UI_PRECISION,
  USD_UI_PRECISION,
} from '../constants';
import { Nullable } from '../interfaces';

export const formatDecimal = (value: Nullable<Numberish>, fractionDigits = USD_UI_PRECISION): Nullable<string> =>
  value
    ? DecimalFormat.format(value, {
        style: 'decimal',
        fractionDigits,
      })
    : null;

export const formatCurrency = (
  value: Nullable<Numberish>,
  options: {
    currency?: string;
    fractionDigits?: number;
    approximate?: boolean;
    lessThanFormat?: boolean;
    pad?: boolean;
  } = {},
): Nullable<string> => {
  if (!value) {
    return null;
  }

  const {
    currency = '$',
    fractionDigits = USD_UI_PRECISION,
    approximate = false,
    lessThanFormat = false,
    pad = false,
  } = options;

  return DecimalFormat.format(value, {
    style: 'currency',
    currency,
    fractionDigits,
    approximate,
    lessThanFormat,
    pad: pad,
  });
};

export const formatCurrencyMultiplier = (value: Nullable<Numberish>): Nullable<string> =>
  value
    ? DecimalFormat.format(value, {
        style: 'multiplier',
        currency: '$',
        fractionDigits: MULTIPLIER_UI_PRECISION,
        noMultiplierFractionDigits: USD_UI_PRECISION,
      })
    : null;

export const formatMultiplier = (value: Nullable<Numberish>, token: Token): Nullable<string> =>
  value
    ? DecimalFormat.format(value, {
        style: 'multiplier',
        currency: token,
        fractionDigits: MULTIPLIER_UI_PRECISION,
        noMultiplierFractionDigits: token === R_TOKEN ? R_TOKEN_UI_PRECISION : COLLATERAL_TOKEN_UI_PRECISION,
      })
    : null;

export const formatPercentage = (value: Nullable<Numberish>): Nullable<string> =>
  value ? DecimalFormat.format(value, { style: 'percentage', fractionDigits: 2, pad: true }) : null;
