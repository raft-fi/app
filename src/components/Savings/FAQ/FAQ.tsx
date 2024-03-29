import { CSSProperties, useCallback, useMemo, useState } from 'react';
import { ButtonWrapper } from 'tempus-ui';
import { Icon, Typography } from '../../shared';

import './FAQ.scss';

const FAQ = () => {
  const [open, setOpen] = useState<boolean>(false);

  const handleClick = useCallback(() => {
    setOpen(prev => !prev);
  }, []);

  const style: CSSProperties = useMemo(() => {
    return {
      maxHeight: open ? '500px' : 0,
    };
  }, [open]);

  return (
    <div className="raft__savings__faq">
      <ButtonWrapper className="raft__savings__faq-header" onClick={handleClick}>
        <Typography variant="body2" weight="medium">
          Frequently Asked Questions
        </Typography>
        {open ? <Icon variant="chevron-up" /> : <Icon variant="chevron-down" />}
      </ButtonWrapper>
      <div className="raft__savings__faq-body" style={style}>
        <div className="raft__savings__faq-item">
          <Typography variant="body" weight="medium">
            What is R?
          </Typography>
          <Typography variant="body">
            R is the most capital-efficient USD stablecoin, backed by both collateralized debt positions (CDPs) and
            protocol reserves.
          </Typography>
        </div>
        <div className="raft__savings__faq-item">
          <Typography variant="body" weight="medium">
            What is RR?
          </Typography>
          <Typography variant="body">
            RR is an ERC-20 token that lets you earn interest on R. It can be transferred freely and is always
            redeemable for an ever-growing amount of R.
          </Typography>
        </div>
        <div className="raft__savings__faq-item">
          <Typography variant="body" weight="medium">
            Where does the yield come from?
          </Typography>
          <Typography variant="body">
            The yield comes from a combination of protocol fees (borrowing fees, liquidation fees, flash mint fees) and
            the yield accumulated on protocol reserves.
          </Typography>
        </div>
      </div>
    </div>
  );
};
export default FAQ;
