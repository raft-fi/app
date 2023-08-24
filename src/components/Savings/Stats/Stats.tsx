import { TokenLogo } from 'tempus-ui';
import { Icon, Tooltip, TooltipWrapper, Typography } from '../../shared';

import './Stats.scss';

const Stats = () => {
  const currentYield = '5.00%';
  const TVL = '1,234,556.00';
  const capacity = '1,234,556.00';

  const showSavings = true;
  const savings = '1,234,556.00';

  return (
    <div className="raft__savings__stats">
      {showSavings && (
        <div className="raft__savings__stats__item raft__savings__stats__item-inverse">
          <div className="raft__savings__stats__item-title">
            <Typography variant="overline" weight="semi-bold" color="text-accent-inverted">
              YOUR SAVINGS
            </Typography>
            <TooltipWrapper
              tooltipContent={
                <Tooltip className="raft__leveragePositionAfter__infoTooltip">
                  <Typography variant="body2">
                    Your savings include your deposited amount plus earned rewards.
                  </Typography>
                </Tooltip>
              }
              placement="bottom"
            >
              <Icon variant="info" size="tiny" color="var(--textAccentInverted)" />
            </TooltipWrapper>
          </div>
          <div className="raft__savings__stats__item-token">
            <TokenLogo type="token-R" size="small" />
            <div className="raft__savings__stats__item-value">
              <Typography variant="heading1" color="text-primary-inverted">
                {savings}
              </Typography>
              <Typography variant="heading2" color="text-primary-inverted">
                R
              </Typography>
            </div>
          </div>
        </div>
      )}

      <div className="raft__savings__stats__item">
        <Typography variant="overline" weight="semi-bold" color="text-accent">
          CURRENT YIELD
        </Typography>
        <Typography variant="heading1">{currentYield}</Typography>
      </div>
      <div className="raft__savings__stats__item">
        <Typography variant="overline" weight="semi-bold" color="text-accent">
          TOTAL VALUE LOCKED
        </Typography>
        <div className="raft__savings__stats__item-token">
          <TokenLogo type="token-R" size="small" />
          <div className="raft__savings__stats__item-value">
            <Typography variant="heading1">{TVL}</Typography>
            <Typography variant="heading2">R</Typography>
          </div>
        </div>
      </div>
      <div className="raft__savings__stats__item">
        <Typography variant="overline" weight="semi-bold" color="text-accent">
          REMAINING CAPACITY
        </Typography>
        <div className="raft__savings__stats__item-token">
          <TokenLogo type="token-R" size="small" />
          <div className="raft__savings__stats__item-value">
            <Typography variant="heading1">{capacity}</Typography>
            <Typography variant="heading2">R</Typography>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Stats;
