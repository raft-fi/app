import { FC, useMemo } from 'react';
import { Decimal } from '@tempusfinance/decimal';
import { Link, TokenLogo } from 'tempus-ui';
import { R_TOKEN, Token } from '@raft-fi/sdk';
import { COLLATERAL_TOKEN_UI_PRECISION, USD_UI_PRECISION } from '../../constants';
import { getCollateralRatioLevel, getCollateralRatioLabel, formatPercentage, formatCurrency } from '../../utils';
import { Typography, Icon, TooltipWrapper, Tooltip, ValueLabel } from '../shared';
import { Nullable } from '../../interfaces';
import { useVaultVersion } from '../../hooks';
import TokenAddressTooltip from './TokenAddressTooltip';

import './PositionAfter.scss';

const HOW_IT_WORKS_DOCS_LINK = 'https://docs.raft.fi/how-it-works/borrowing';

interface PositionAfterProps {
  displayCollateralToken: Token;
  displayCollateralTokenAmount: Nullable<Decimal>;
  borrowingFeePercentageFormatted: Nullable<string>;
  interestRateFormatted: Nullable<string>;
  borrowingFeeAmountFormatted: Nullable<string>;
  borrowTokenAmountFormatted: Nullable<string>;
  liquidationPrice: Nullable<Decimal>;
  liquidationPriceChange: Nullable<Decimal>;
  collateralTokenValueFormatted: Nullable<string>;
  collateralizationRatio: Nullable<Decimal>;
  previousCollateralizationRatio?: Nullable<Decimal>;
}

export const PositionAfter: FC<PositionAfterProps> = ({
  displayCollateralToken,
  displayCollateralTokenAmount,
  borrowingFeePercentageFormatted,
  interestRateFormatted,
  borrowingFeeAmountFormatted,
  borrowTokenAmountFormatted,
  liquidationPrice,
  liquidationPriceChange,
  collateralTokenValueFormatted,
  collateralizationRatio,
  previousCollateralizationRatio,
}) => {
  const vaultVersion = useVaultVersion();

  const baseTokenAmountFormatted = useMemo(
    () =>
      formatCurrency(displayCollateralTokenAmount ?? Decimal.ZERO, {
        currency: displayCollateralToken,
        fractionDigits: COLLATERAL_TOKEN_UI_PRECISION,
        lessThanFormat: true,
      }) as string,
    [displayCollateralToken, displayCollateralTokenAmount],
  );

  const liquidationPriceFormatted = useMemo(
    () =>
      formatCurrency(liquidationPrice, {
        currency: '$',
        approximate: true,
        fractionDigits: USD_UI_PRECISION,
        pad: true,
      }),
    [liquidationPrice],
  );

  const liquidationPriceChangeFormatted = useMemo(
    () => formatPercentage(liquidationPriceChange),
    [liquidationPriceChange],
  );

  const collateralizationRatioFormatted = useMemo(
    () => formatPercentage(collateralizationRatio) ?? 'N/A',
    [collateralizationRatio],
  );

  const collateralRatioLevel = useMemo(() => getCollateralRatioLevel(collateralizationRatio), [collateralizationRatio]);
  const collateralRatioLabel = useMemo(() => getCollateralRatioLabel(collateralizationRatio), [collateralizationRatio]);

  return (
    <div className="raft__position-after__data">
      <div className="raft__position-after__data__position">
        <div className="raft__position-after__data__position__title">
          <Typography variant="overline">POSITION AFTER</Typography>
          <TooltipWrapper
            tooltipContent={
              <Tooltip className="raft__position-after__infoTooltip">
                <Typography variant="body2">
                  Summary of your position after the transaction is executed.{' '}
                  <Link href={HOW_IT_WORKS_DOCS_LINK}>
                    Docs <Icon variant="external-link" size={10} />
                  </Link>
                </Typography>
              </Tooltip>
            }
            placement="top"
          >
            <Icon variant="info" size="tiny" />
          </TooltipWrapper>
        </div>
        <ul className="raft__position-after__data__position__data">
          <li className="raft__position-after__data__position__data__deposit">
            <TooltipWrapper tooltipContent={<TokenAddressTooltip />} placement="top">
              <TokenLogo type={`token-${displayCollateralToken}`} size={20} />
            </TooltipWrapper>
            <ValueLabel value={baseTokenAmountFormatted} valueSize="body" tickerSize="caption" />
            {collateralTokenValueFormatted && (
              <Typography
                className="raft__position-after__data__position__data__deposit__value"
                variant="body"
                weight="medium"
                color="text-secondary"
              >
                (
                <ValueLabel
                  value={collateralTokenValueFormatted}
                  tickerSize="caption"
                  valueSize="body"
                  color="text-secondary"
                />
                )
              </Typography>
            )}
          </li>
          <li className="raft__position-after__data__position__data__debt">
            <TooltipWrapper tooltipContent={<TokenAddressTooltip />} placement="top">
              <TokenLogo type={`token-${R_TOKEN}`} size={20} />
            </TooltipWrapper>
            <ValueLabel value={borrowTokenAmountFormatted ?? `0.00 ${R_TOKEN}`} valueSize="body" tickerSize="caption" />
          </li>
          <li className="raft__position-after__data__position__data__ratio">
            {!collateralizationRatio || collateralizationRatio.isZero() ? (
              <>
                <div className="raft__position-after__data__position__data__ratio__empty-status" />
                <Typography variant="body" weight="medium">
                  N/A
                </Typography>
              </>
            ) : (
              <>
                {previousCollateralizationRatio?.equals(collateralizationRatio) ? (
                  <div className="raft__position-after__data__position__data__ratio__empty-status" />
                ) : (
                  <Icon
                    variant={previousCollateralizationRatio?.gt(collateralizationRatio) ? 'arrow-down' : 'arrow-up'}
                    size="tiny"
                  />
                )}
                <div
                  className={`raft__position-after__data__position__data__ratio__status status-risk-${collateralRatioLevel}`}
                />
                <ValueLabel value={collateralizationRatioFormatted} valueSize="body" tickerSize="caption" />
                <Typography variant="body" weight="medium" color="text-secondary">
                  ({collateralRatioLabel})
                </Typography>
              </>
            )}
          </li>
        </ul>
      </div>
      <div className="raft__position-after__data__others">
        {vaultVersion === 'v1' ? (
          <>
            <div className="raft__position-after__data__protocol-fee__title">
              <Typography variant="overline">PROTOCOL FEES</Typography>
              <TooltipWrapper
                tooltipContent={
                  <Tooltip className="raft__position-after__infoTooltip">
                    <Typography variant="body2">
                      Borrowing fees associated with your transaction. Read the docs for more information.{' '}
                      <Link href="https://docs.raft.fi/how-it-works/borrowing">
                        Docs <Icon variant="external-link" size={10} />
                      </Link>
                    </Typography>
                  </Tooltip>
                }
                placement="top"
              >
                <Icon variant="info" size="tiny" />
              </TooltipWrapper>
            </div>
            <div className="raft__position-after__data__protocol-fee__percent">
              {borrowingFeePercentageFormatted && (
                <ValueLabel value={borrowingFeePercentageFormatted} valueSize="body" tickerSize="caption" />
              )}
              {borrowingFeeAmountFormatted && (
                <Typography
                  className="raft__position-after__data__protocol-fee__percent-value"
                  variant="body"
                  weight="medium"
                  color="text-secondary"
                >
                  (
                  <ValueLabel
                    value={borrowingFeeAmountFormatted}
                    tickerSize="caption"
                    valueSize="body"
                    color="text-secondary"
                  />
                  )
                </Typography>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="raft__position-after__data__protocol-fee__title">
              <Typography variant="overline">INTEREST RATE</Typography>
              <TooltipWrapper
                tooltipContent={
                  <Tooltip className="raft__position-after__infoTooltip">
                    <Typography variant="body2">TODO - Add tooltip text</Typography>
                  </Tooltip>
                }
                placement="top"
              >
                <Icon variant="info" size="tiny" />
              </TooltipWrapper>
            </div>
            <div className="raft__position-after__data__protocol-fee__percent">
              {interestRateFormatted && (
                <ValueLabel value={interestRateFormatted} valueSize="body" tickerSize="caption" />
              )}
            </div>
          </>
        )}

        <div className="raft__position-after__data__liquidation__title">
          <Typography variant="overline">LIQUIDATION PRICE</Typography>
          <TooltipWrapper
            tooltipContent={
              <Tooltip className="raft__position-after__infoTooltip">
                <Typography variant="body2">
                  If the oracle price of the contract reaches below the liquidation price, your position will be
                  liquidated. <Link href="https://docs.raft.fi/glossary">Learn more</Link>.
                </Typography>
              </Tooltip>
            }
            placement="top"
          >
            <Icon variant="info" size="tiny" />
          </TooltipWrapper>
        </div>
        <div className="raft__position-after__data__liquidation__price">
          <ValueLabel value={liquidationPriceFormatted ?? 'N/A'} valueSize="body" tickerSize="caption" />
          {liquidationPriceChangeFormatted && (
            <Typography
              className="raft__position-after__data__liquidation__price-value"
              variant="body"
              color="text-secondary"
              weight="medium"
            >
              (
              <ValueLabel
                value={liquidationPriceChangeFormatted}
                color="text-secondary"
                valueSize="body"
                tickerSize="caption"
              />
              )
            </Typography>
          )}
        </div>
      </div>
    </div>
  );
};
