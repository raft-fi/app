import { RaftConfig, RAFT_BPT_TOKEN } from '@raft-fi/sdk';
import { FC, memo, useCallback, useState } from 'react';
import { Link } from 'tempus-ui';
import { Expandable, Typography } from '../shared';

interface HowToLockProps {
  defaultOpen?: boolean;
}

const HowToLock: FC<HowToLockProps> = ({ defaultOpen }) => {
  const [open, setOpen] = useState<boolean>(Boolean(defaultOpen));

  const onToggle = useCallback(() => setOpen(prev => !prev), []);

  return (
    <Expandable open={open} title="How to lock and earn more RAFT?" onToggle={onToggle}>
      <ol>
        <li>
          <Typography variant="body">
            Add liquidity to the{' '}
            <Link href={`https://app.balancer.fi/#/ethereum/pool/${RaftConfig.networkConfig.balancerWeightedPoolId}`}>
              {RAFT_BPT_TOKEN} pool on Balancer
            </Link>
            .
          </Typography>
        </li>
        <li>
          <Typography variant="body">Stake your RAFT BPT token on Raft.</Typography>
        </li>
        <li>
          <Typography variant="body">
            The longer the RAFT BPT is staked, the greater the voting power and RAFT rewards.
          </Typography>
        </li>
      </ol>
      <Typography variant="body">
        <Link href="https://docs.raft.fi/">Learn more</Link> about veRAFT.
      </Typography>
    </Expandable>
  );
};

export default memo(HowToLock);
