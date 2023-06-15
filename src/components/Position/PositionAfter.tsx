import { FC, useMemo } from 'react';
import { Decimal, DecimalFormat } from '@tempusfinance/decimal';
import { Link, TokenLogo } from 'tempus-ui';
import { R_TOKEN, Token } from '@raft-fi/sdk';
import { COLLATERAL_TOKEN_UI_PRECISION, TOKEN_TO_DISPLAY_BASE_TOKEN_MAP } from '../../constants';
import { getCollateralRatioLevel, getCollateralRatioLabel } from '../../utils';
import { Typography, Icon, TooltipWrapper, Tooltip, ValueLabel } from '../shared';
import { Nullable } from '../../interfaces';
import TokenAddressTooltip from './TokenAddressTooltip';

import './PositionAfter.scss';

const HOW_IT_WORKS_DOCS_LINK = 'https://docs.raft.fi/how-it-works/borrowing';

interface PositionAfterProps {
  displayCollateralToken: Token;
  displayCollateralTokenAmount: Nullable<Decimal>;
  borrowingFeePercentageFormatted: Nullable<string>;
  borrowingFeeAmountFormatted: Nullable<string>;
  borrowTokenAmountFormatted: Nullable<string>;
  collateralTokenValueFormatted: Nullable<string>;
  collateralizationRatio: Nullable<Decimal>;
  previousCollateralizationRatio?: Nullable<Decimal>;
}

export const PositionAfter: FC<PositionAfterProps> = ({
  displayCollateralToken,
  displayCollateralTokenAmount,
  borrowingFeePercentageFormatted,
  borrowingFeeAmountFormatted,
  borrowTokenAmountFormatted,
  collateralTokenValueFormatted,
  collateralizationRatio,
  previousCollateralizationRatio,
}) => {
  const baseTokenAmountFormatted = useMemo(
    () =>
      DecimalFormat.format(displayCollateralTokenAmount ?? Decimal.ZERO, {
        style: 'currency',
        currency: TOKEN_TO_DISPLAY_BASE_TOKEN_MAP[displayCollateralToken],
        fractionDigits: COLLATERAL_TOKEN_UI_PRECISION,
        lessThanFormat: true,
      }),
    [displayCollateralToken, displayCollateralTokenAmount],
  );

  const collateralizationRatioFormatted = useMemo(
    () =>
      collateralizationRatio
        ? DecimalFormat.format(collateralizationRatio, { style: 'percentage', fractionDigits: 2, pad: true })
        : 'N/A',
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
              <TokenLogo type={`token-${TOKEN_TO_DISPLAY_BASE_TOKEN_MAP[displayCollateralToken]}`} size={20} />
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
      </div>
    </div>
  );
};
