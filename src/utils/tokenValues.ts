import { Numberish, Decimal } from '@tempusfinance/decimal';
import {
  COLLATERAL_TOKEN_UI_PRECISION,
  R_PRICE_UI_PRECISION,
  R_TOKEN_UI_PRECISION,
  USD_UI_PRECISION,
} from '../constants';
import { Nullable } from '../interfaces';
import { Token } from '@raft-fi/sdk';
import { formatCurrency, formatCurrencyMultiplier, formatMultiplier } from './decimal';

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
        amountFormatted: formatCurrency(tokenAmount, {
          currency: token,
          fractionDigits: tokenAmount.isZero() ? 0 : R_TOKEN_UI_PRECISION,
        }),
        amountFormattedMultiplier: formatMultiplier(tokenAmount, token),
        amountFormattedApproximate: formatCurrency(tokenAmount, {
          currency: token,
          fractionDigits: tokenAmount.isZero() ? 0 : R_TOKEN_UI_PRECISION,
          approximate: tokenAmount.isZero() ? false : true,
          lessThanFormat: true,
          pad: true,
        }),
        // only for R price we want to format it in 4 decimal places
        priceFormatted: formatCurrency(price, { currency: '$', fractionDigits: R_PRICE_UI_PRECISION }),
        priceFormattedIntegral: formatCurrency(price, { currency: '$', fractionDigits: 0 }),
        valueFormatted: formatCurrency(tokenValue),
        valueFormattedMultiplier: formatCurrencyMultiplier(tokenValue),
        valueFormattedApproximate: formatCurrency(tokenValue, {
          currency: '$',
          fractionDigits: tokenValue?.isZero() ? 0 : USD_UI_PRECISION,
          approximate: tokenValue?.isZero() ? false : true,
          lessThanFormat: true,
          pad: true,
        }),
      };
    case 'stETH':
    case 'wstETH':
    case 'rETH':
    case 'wcrETH-v1':
    case 'WETH':
    case 'rETH-v1':
    case 'wstETH-v1':
    case 'cbETH':
    case 'swETH':
    default:
      return {
        amount: tokenAmount,
        price,
        value: tokenValue,
        amountFormatted: formatCurrency(tokenAmount, {
          currency: token,
          fractionDigits: tokenAmount.isZero() ? 0 : COLLATERAL_TOKEN_UI_PRECISION,
        }),
        amountFormattedMultiplier: formatMultiplier(tokenAmount, token),
        amountFormattedApproximate: formatCurrency(tokenAmount, {
          currency: token,
          fractionDigits: tokenAmount.isZero() ? 0 : COLLATERAL_TOKEN_UI_PRECISION,
          approximate: tokenAmount.isZero() ? false : true,
          lessThanFormat: true,
          pad: true,
        }),
        priceFormatted: formatCurrency(price),
        priceFormattedIntegral: formatCurrency(price, { currency: '$', fractionDigits: 0 }),
        valueFormatted: formatCurrency(tokenValue),
        valueFormattedMultiplier: formatCurrencyMultiplier(tokenValue),
        valueFormattedApproximate: formatCurrency(tokenValue, {
          currency: '$',
          fractionDigits: tokenValue?.isZero() ? 0 : USD_UI_PRECISION,
          approximate: tokenValue?.isZero() ? false : true,
          lessThanFormat: true,
          pad: true,
        }),
      };
  }
};
