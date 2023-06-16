import { Numberish, Decimal, DecimalFormat } from '@tempusfinance/decimal';
import {
  COLLATERAL_TOKEN_UI_PRECISION,
  MULTIPLIER_UI_PRECISION,
  R_PRICE_UI_PRECISION,
  R_TOKEN_UI_PRECISION,
  USD_UI_PRECISION,
} from '../constants';
import { Nullable } from '../interfaces';
import { Token } from '@raft-fi/sdk';

type TokenValues = {
  amount: Nullable<Decimal>;
  price: Nullable<Decimal>;
  value: Nullable<Decimal>;
  amountFormatted: Nullable<string>;
  amountFormattedMultiplier: Nullable<string>;
  amountFormattedApproximate: Nullable<string>;
  priceFormatted: Nullable<string>;
  priceFormattedIntegral: Nullable<string>;
  valueFormatted: Nullable<string>;
  valueFormattedMultiplier: Nullable<string>;
  valueFormattedApproximate: Nullable<string>;
};

const formatCurrency = (
  value: Decimal,
  currency = '$',
  precision = USD_UI_PRECISION,
  approximate = false,
  lessThanFormat = false,
  pad = false,
) =>
  DecimalFormat.format(value, {
    style: 'currency',
    currency: currency,
    fractionDigits: precision,
    approximate: approximate,
    lessThanFormat: lessThanFormat,
    pad: pad,
  });

const formatCurrencyMultiplier = (value: Decimal) =>
  DecimalFormat.format(value, {
    style: 'multiplier',
    currency: '$',
    fractionDigits: MULTIPLIER_UI_PRECISION,
    noMultiplierFractionDigits: USD_UI_PRECISION,
  });

export const getTokenValues = (amount: Nullable<Numberish>, price: Nullable<Decimal>, token: Token): TokenValues => {
  if (!amount && amount !== 0) {
    return {
      amount: null,
      price: null,
      value: null,
      amountFormatted: null,
      amountFormattedMultiplier: null,
      amountFormattedApproximate: null,
      priceFormatted: null,
      priceFormattedIntegral: null,
      valueFormatted: null,
      valueFormattedMultiplier: null,
      valueFormattedApproximate: null,
    };
  }

  const tokenAmount = Decimal.parse(amount, 0);
  const tokenValue = price?.mul(tokenAmount) ?? null;

  switch (token) {
    case 'R':
      return {
        amount: tokenAmount,
        price,
        value: tokenValue,
        amountFormatted: formatCurrency(tokenAmount, token, tokenAmount.isZero() ? 0 : R_TOKEN_UI_PRECISION),
        amountFormattedMultiplier: DecimalFormat.format(tokenAmount, {
          style: 'multiplier',
          currency: token,
          fractionDigits: MULTIPLIER_UI_PRECISION,
          noMultiplierFractionDigits: R_TOKEN_UI_PRECISION,
        }),
        amountFormattedApproximate: formatCurrency(
          tokenAmount,
          token,
          tokenAmount.isZero() ? 0 : R_TOKEN_UI_PRECISION,
          tokenAmount.isZero() ? false : true,
          true,
          true,
        ),
        // only for R price we want to format it in 4 decimal places
        priceFormatted: price ? formatCurrency(price, '$', R_PRICE_UI_PRECISION) : null,
        priceFormattedIntegral: price ? formatCurrency(price, '$', 0) : null,
        valueFormatted: tokenValue ? formatCurrency(tokenValue) : null,
        valueFormattedMultiplier: tokenValue ? formatCurrencyMultiplier(tokenValue) : null,
        valueFormattedApproximate: tokenValue
          ? formatCurrency(
              tokenValue,
              '$',
              tokenValue.isZero() ? 0 : USD_UI_PRECISION,
              tokenValue.isZero() ? false : true,
              true,
              true,
            )
          : null,
      };
    case 'ETH':
    case 'stETH':
    case 'wstETH':
      return {
        amount: tokenAmount,
        price,
        value: tokenValue,
        amountFormatted: formatCurrency(tokenAmount, token, tokenAmount.isZero() ? 0 : COLLATERAL_TOKEN_UI_PRECISION),
        amountFormattedMultiplier: DecimalFormat.format(tokenAmount, {
          style: 'multiplier',
          currency: token,
          fractionDigits: MULTIPLIER_UI_PRECISION,
          noMultiplierFractionDigits: COLLATERAL_TOKEN_UI_PRECISION,
        }),
        amountFormattedApproximate: formatCurrency(
          tokenAmount,
          token,
          tokenAmount.isZero() ? 0 : COLLATERAL_TOKEN_UI_PRECISION,
          tokenAmount.isZero() ? false : true,
          true,
          true,
        ),
        priceFormatted: price ? formatCurrency(price) : null,
        priceFormattedIntegral: price ? formatCurrency(price, '$', 0) : null,
        valueFormatted: tokenValue ? formatCurrency(tokenValue) : null,
        valueFormattedMultiplier: tokenValue ? formatCurrencyMultiplier(tokenValue) : null,
        valueFormattedApproximate: tokenValue
          ? formatCurrency(
              tokenValue,
              '$',
              tokenValue.isZero() ? 0 : USD_UI_PRECISION,
              tokenValue.isZero() ? false : true,
              true,
              true,
            )
          : null,
      };
  }
};
