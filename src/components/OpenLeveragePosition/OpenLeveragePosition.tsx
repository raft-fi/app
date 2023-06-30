import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button, CurrencyInput, Icon, SliderInput, Typography, InfoBox } from '../shared';

import './OpenLeveragePosition.scss';
import { LeveragePositionAction, LeveragePositionAfter } from '../LeveragePosition';
import { Decimal } from '@tempusfinance/decimal';

const OpenLeveragePosition = () => {
  const onSettingsClick = useCallback(() => {
    // TODO - Add settings popup
  }, []);

  const onTargetLeverageChange = useCallback(() => {
    // TODO - Add target leverage change
  }, []);

  return (
    <div className="raft__openLeveragePosition">
      {/* HEADER */}
      <div className="raft__openLeveragePositionHeader">
        <div className="raft__openLeveragePositionHeaderTitle">
          <Link className="raft__openLeveragePositionHeaderBack" to="/">
            <Icon variant="arrow-left" size={12} />
          </Link>
          <Typography variant="heading2" weight="medium">
            Open leverage Position
          </Typography>
        </div>
        <div className="raft__openLeveragePositionHeaderActions">
          <Button variant="secondary" onClick={onSettingsClick}>
            <Icon variant="settings" size={16} />
          </Button>
        </div>
      </div>

      {/* INPUTS */}
      <div className="raft__openLeveragePositionInputs">
        <CurrencyInput
          label="YOU DEPOSIT"
          precision={18}
          selectedToken="stETH"
          tokens={['stETH, wstETH, rETH']}
          value="100"
        />
        <SliderInput
          label="TARGET LEVERAGE"
          value={3}
          min={1}
          max={6}
          step={0.1}
          onValueChange={onTargetLeverageChange}
        />
      </div>

      {/* WARNING BOX */}
      <InfoBox
        variant="warning"
        text="This feature flash mints R, and sources liquidity from decentralized exchanges. Read more about the risks here."
      />

      {/* POSITION AFTER TX */}
      <LeveragePositionAfter
        liquidationPrice={new Decimal(1000)}
        liquidationPriceChange={new Decimal(0.09)}
        leverageAPR={new Decimal(0.25)}
        priceImpact={new Decimal(-0.02)}
      />

      {/* ACTION BUTTON */}
      <LeveragePositionAction />
    </div>
  );
};
export default OpenLeveragePosition;
