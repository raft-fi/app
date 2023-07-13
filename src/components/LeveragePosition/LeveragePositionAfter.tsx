import { FC, useMemo } from 'react';
import { Icon, Tooltip, TooltipWrapper, Typography, ValueLabel } from '../shared';
import './LeveragePositionAfter.scss';
import { Decimal } from '@tempusfinance/decimal';
import { USD_UI_PRECISION } from '../../constants';
import { Nullable } from '../../interfaces';
import { formatCurrency, formatPercentage } from '../../utils';
import { Link } from 'tempus-ui';

interface LeveragePositionAfterProps {
  liquidationPrice: Nullable<Decimal>;
  liquidationPriceChange: Nullable<Decimal>;
  leverageAPR: Nullable<Decimal>;
  totalFee: Nullable<Decimal>;
  liquidationPriceLabel: string;
  leverageAPRLabel: string;
}

const LeveragePositionAfter: FC<LeveragePositionAfterProps> = ({
  liquidationPrice,
  liquidationPriceChange,
  leverageAPR,
  totalFee,
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

  const totalFeeFormatted = useMemo(() => formatPercentage(totalFee), [totalFee]);

  return (
    <div className="raft__leveragePositionAfter">
      <div className="raft__leveragePositionAfter__dataColumn">
        <div className="raft__leveragePositionAfter__dataTitle">
          <Typography variant="overline" weight="semi-bold" color="text-secondary">
            {liquidationPriceLabel}
          </Typography>
          <TooltipWrapper
            tooltipContent={
              <Tooltip className="raft__leveragePositionAfter__infoTooltip">
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
          <TooltipWrapper
            tooltipContent={
              <Tooltip className="raft__leveragePositionAfter__infoTooltip">
                <Typography variant="body2">
                  The resulting APR is based on your collateral deposit and target leverage.{' '}
                  <Link href="https://docs.raft.fi/glossary">Learn more</Link>.
                </Typography>
              </Tooltip>
            }
            placement="top"
          >
            <Icon variant="info" size="tiny" />
          </TooltipWrapper>
        </div>
        <div className="raft__leveragePositionAfter__dataRow">
          <div className="raft__leveragePositionAfter__dataRowValues">
            <ValueLabel value={leverageAPRFormatted ?? 'N/A'} valueSize="body" tickerSize="caption" />
          </div>
        </div>
      </div>

      {/* SECOND COLUMN */}
      <div className="raft__leveragePositionAfter__dataColumn">
        {/* PRICE IMPACT */}
        <div className="raft__leveragePositionAfter__dataTitle">
          <Typography variant="overline" weight="semi-bold" color="text-secondary">
            TOTAL COST
          </Typography>
          <TooltipWrapper
            tooltipContent={
              <Tooltip className="raft__leveragePositionAfter__infoTooltip">
                <Typography variant="body2">
                  The total costs for the transaction, including flash mint fee, borrowing fee, swap fee, price impact,
                  and slippage. <Link href="https://docs.raft.fi/glossary">Learn more</Link>.
                </Typography>
              </Tooltip>
            }
            placement="top"
          >
            <Icon variant="info" size="tiny" />
          </TooltipWrapper>
        </div>
        <div className="raft__leveragePositionAfter__dataRow">
          <div className="raft__leveragePositionAfter__dataRowValues">
            <ValueLabel value={totalFeeFormatted ?? 'N/A'} valueSize="body" tickerSize="caption" />
          </div>
        </div>
      </div>
    </div>
  );
};
export default LeveragePositionAfter;
