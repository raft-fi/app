import { FC, useMemo } from 'react';
import { Icon, Tooltip, TooltipWrapper, Typography, ValueLabel } from '../shared';
import './LeveragePositionAfter.scss';
import { Decimal, DecimalFormat } from '@tempusfinance/decimal';
import { USD_UI_PRECISION } from '../../constants';
import { Nullable } from '../../interfaces';
import { formatCurrency, formatPercentage } from '../../utils';

interface LeveragePositionAfterProps {
  liquidationPrice: Nullable<Decimal>;
  liquidationPriceChange: Nullable<Decimal>;
  leverageAPR: Nullable<Decimal>;
  priceImpact: Decimal;
  liquidationPriceLabel: string;
  leverageAPRLabel: string;
}

const LeveragePositionAfter: FC<LeveragePositionAfterProps> = ({
  liquidationPrice,
  liquidationPriceChange,
  leverageAPR,
  priceImpact,
  liquidationPriceLabel,
  leverageAPRLabel,
}) => {
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

  const leverageAPRFormatted = useMemo(
    () =>
      formatPercentage(leverageAPR, {
        approximate: true,
      }),
    [leverageAPR],
  );

  const priceImpactFormatted = useMemo(() => {
    return DecimalFormat.format(priceImpact, {
      style: 'percentage',
      fractionDigits: 2,
      pad: true,
    });
  }, [priceImpact]);

  return (
    <div className="raft__leveragePositionAfter">
      <div className="raft__leveragePositionAfter__dataColumn">
        <div className="raft__leveragePositionAfter__dataTitle">
          <Typography variant="overline" weight="semi-bold" color="text-secondary">
            {liquidationPriceLabel}
          </Typography>
          {/* TODO - Update tooltip content */}
          <TooltipWrapper
            tooltipContent={
              <Tooltip className="raft__leveragePositionAfter__infoTooltip">
                <Typography variant="body2">TODO</Typography>
              </Tooltip>
            }
            placement="top"
          >
            <Icon variant="info" size="tiny" />
          </TooltipWrapper>
        </div>
        <div className="raft__leveragePositionAfter__dataRow">
          <div className="raft__leveragePositionAfter__dataRowValues">
            <ValueLabel value={liquidationPriceFormatted ?? 'N/A'} valueSize="body" tickerSize="caption" />
            {liquidationPriceChangeFormatted && (
              <Typography
                className="raft__leveragePositionAfter__dataRowValue"
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

        {/* LEVERAGE APR */}
        <div className="raft__leveragePositionAfter__dataTitle">
          <Typography variant="overline" weight="semi-bold" color="text-secondary">
            {leverageAPRLabel}
          </Typography>
          {/* TODO - Update tooltip content */}
          <TooltipWrapper
            tooltipContent={
              <Tooltip className="raft__leveragePositionAfter__infoTooltip">
                <Typography variant="body2">TODO</Typography>
              </Tooltip>
            }
            placement="top"
          >
            <Icon variant="info" size="tiny" />
          </TooltipWrapper>
        </div>
        <div className="raft__leveragePositionAfter__dataRow">
          <div className="raft__leveragePositionAfter__dataRowValues">
            <ValueLabel value={leverageAPRFormatted ?? '---'} valueSize="body" tickerSize="caption" />
          </div>
        </div>
      </div>

      {/* SECOND COLUMN */}
      <div className="raft__leveragePositionAfter__dataColumn">
        {/* PRICE IMPACT */}
        <div className="raft__leveragePositionAfter__dataTitle">
          <Typography variant="overline" weight="semi-bold" color="text-secondary">
            TOTAL FEES (FAKE)
          </Typography>
          {/* TODO - Update tooltip content */}
          <TooltipWrapper
            tooltipContent={
              <Tooltip className="raft__leveragePositionAfter__infoTooltip">
                <Typography variant="body2">TODO</Typography>
              </Tooltip>
            }
            placement="top"
          >
            <Icon variant="info" size="tiny" />
          </TooltipWrapper>
        </div>
        <div className="raft__leveragePositionAfter__dataRow">
          <div className="raft__leveragePositionAfter__dataRowValues">
            <ValueLabel value={priceImpactFormatted} valueSize="body" tickerSize="caption" />
          </div>
        </div>
      </div>
    </div>
  );
};
export default LeveragePositionAfter;
