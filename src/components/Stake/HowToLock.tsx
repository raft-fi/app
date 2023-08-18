import { RAFT_BPT_TOKEN } from '@raft-fi/sdk';
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
            <Link href="https://app.balancer.fi/#/ethereum/pool/0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014">
              {RAFT_BPT_TOKEN} pool on Balancer
            </Link>
            .
          </Typography>
        </li>
        <li>
          <Typography variant="body">Lock-up the Balancer LP token ({RAFT_BPT_TOKEN}) on Raft.</Typography>
        </li>
        <li>
          <Typography variant="body">
            The longer the Balancer LP token is locked, the more voting power is received and boosted RAFT rewards.
          </Typography>
        </li>
        <li>
          <Typography variant="body">
            Use this voting power to choose which pool gauges get allocated liquidity mining incentives. Vote on the
            pools where you have added liquidity to earn more yield.
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
