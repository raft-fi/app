import { FC, memo, useCallback, useState } from 'react';
import { Expandable, Typography } from '../shared';

interface FAQProps {
  defaultOpen?: boolean;
}

const FAQ: FC<FAQProps> = ({ defaultOpen }) => {
  const [open, setOpen] = useState<boolean>(Boolean(defaultOpen));

  const onToggle = useCallback(() => setOpen(prev => !prev), []);

  return (
    <Expandable open={open} title="Frequently Asked Questions" onToggle={onToggle}>
      <Typography variant="body" weight="medium">
        What is RAFT?
      </Typography>
      <Typography variant="body">Raft governance token (RAFT) is the core token powering the Raft protocol.</Typography>
      <br />
      <Typography variant="body" weight="medium">
        What is RAFT BPT?
      </Typography>
      <Typography variant="body">
        Raft BPT represents a share of the liquidity provided in the Balancer AMM pool.
      </Typography>
      <br />
      <Typography variant="body" weight="medium">
        What is veRAFT?
      </Typography>
      <Typography variant="body">
        veRAFT is received when RAFT BPT is locked for a period of time. veRAFT holders receive additional RAFT rewards
        for their long-term alignment.
      </Typography>
    </Expandable>
  );
};

export default memo(FAQ);
