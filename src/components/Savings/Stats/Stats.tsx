import { TokenLogo } from 'tempus-ui';
import { Typography } from '../../shared';

import './Stats.scss';

const Stats = () => {
  const currentYield = '5.00%';
  const TVL = '1,234,556.00';
  const capacity = '1,234,556.00';

  return (
    <div className="raft__savings__stats">
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
