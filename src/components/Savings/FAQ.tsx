import { memo, useCallback, useState } from 'react';
import { Expandable, Typography } from '../shared';

const FAQ = () => {
  const [open, setOpen] = useState<boolean>(false);

  const onToggle = useCallback(() => setOpen(prev => !prev), []);

  return (
    <Expandable open={open} title="Frequently Asked Questions" onToggle={onToggle}>
      <Typography variant="body" weight="medium">
        What is R?
      </Typography>
      <Typography variant="body">
        R is the most capital-efficient USD stablecoin, backed by both collateralized debt positions (CDPs) and protocol
        reserves.
      </Typography>
      <br />
      <Typography variant="body" weight="medium">
        What is RR?
      </Typography>
      <Typography variant="body">
        RR is an ERC-20 token that lets you earn interest on R. It can be transferred freely and is always redeemable
        for an ever-growing amount of R.
      </Typography>
      <br />
      <Typography variant="body" weight="medium">
        Where does the yield come from?
      </Typography>
      <Typography variant="body">
        The yield comes from a combination of protocol fees (borrowing fees, liquidation fees, flash mint fees) and the
        yield accumulated on protocol reserves.
      </Typography>
    </Expandable>
  );
};

export default memo(FAQ);
