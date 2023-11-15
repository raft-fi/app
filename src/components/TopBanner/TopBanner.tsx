import { memo } from 'react';
import { Link } from '@tempusfinance/common-ui';
import { Typography } from '../shared';

import './TopBanner.scss';

const TopBanner = () => (
  <div className="raft__top-banner">
    <Typography variant="body2" weight="medium" color="text-error">
      Raft has experienced a security incident on 10 November 2023. Please do not interact with the protocol until
      further notice.{' '}
      <Link href="https://mirror.xyz/0xa486d3a7679D56D545dd5d357469Dd5ed4259340/_Nk6_1_VvInyC0pdvHiZuAXiqm6tYSsGYGHSfOhcO1I">
        Read more
      </Link>
    </Typography>
  </div>
);

export default memo(TopBanner);
