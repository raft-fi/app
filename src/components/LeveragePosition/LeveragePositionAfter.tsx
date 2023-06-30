import { FC, useMemo } from 'react';
import { Icon, Tooltip, TooltipWrapper, Typography, ValueLabel } from '../shared';
import './LeveragePositionAfter.scss';
import { Decimal, DecimalFormat } from '@tempusfinance/decimal';
import { USD_UI_PRECISION } from '../../constants';

interface LeveragePositionAfterProps {
  liquidationPrice: Decimal;
  liquidationPriceChange: Decimal;
  leverageAPR: Decimal;
  priceImpact: Decimal;
}

const LeveragePositionAfter: FC<LeveragePositionAfterProps> = ({
  liquidationPrice,
  liquidationPriceChange,
  leverageAPR,
  priceImpact,
}) => {
  const liquidationPriceFormatted = useMemo(() => {
    return DecimalFormat.format(liquidationPrice, {
      style: 'currency',
      currency: '$',
      approximate: true,
      fractionDigits: USD_UI_PRECISION,
      pad: true,
    });
  }, [liquidationPrice]);

  const liquidationPriceChangeFormatted = useMemo(() => {
    return DecimalFormat.format(liquidationPriceChange, {
      style: 'percentage',
      fractionDigits: 2,
      pad: true,
    });
  }, [liquidationPriceChange]);

  const leverageAPRFormatted = useMemo(() => {
    return DecimalFormat.format(leverageAPR, {
      style: 'percentage',
      approximate: true,
      fractionDigits: 2,
      pad: true,
    });
  }, [leverageAPR]);

  const priceImpactFormatted = useMemo(() => {
    return DecimalFormat.format(priceImpact, {
      style: 'percentage',
      fractionDigits: 2,
      pad: true,
    });
  }, [priceImpact]);

  return (
    <div className="raft__leveragePositionAfter">
      {/* FIRST COLUMN */}
      <div className="raft__leveragePositionAfter__dataColumn">
        {/* LIQUIDATION PRICE */}
        <div className="raft__leveragePositionAfter__dataTitle">
          <Typography variant="overline" weight="semi-bold" color="text-secondary">
            LIQUIDATION PRICE
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
            <ValueLabel value={liquidationPriceFormatted} valueSize="body" tickerSize="caption" />
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
          </div>
        </div>

        {/* LEVERAGE APR */}
        <div className="raft__leveragePositionAfter__dataTitle">
          <Typography variant="overline" weight="semi-bold" color="text-secondary">
            LEVERAGE APR
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
            <ValueLabel value={leverageAPRFormatted} valueSize="body" tickerSize="caption" />
          </div>
        </div>
      </div>

      {/* SECOND COLUMN */}
      <div className="raft__leveragePositionAfter__dataColumn">
        {/* PRICE IMPACT */}
        <div className="raft__leveragePositionAfter__dataTitle">
          <Typography variant="overline" weight="semi-bold" color="text-secondary">
            PRICE IMPACT
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
