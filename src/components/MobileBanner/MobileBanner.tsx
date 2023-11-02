import { useCallback } from 'react';
import { RAFT_HOMEPAGE_URL } from '../../constants';
import Logo from '../Logo/RaftLogo';
import { Button, Typography } from '../shared';

import './MobileBanner.scss';

const MobileBanner = () => {
  const onActionClick = useCallback(() => {
    window.open(RAFT_HOMEPAGE_URL, '_self');
  }, []);

  return (
    <div className="raft__mobile-banner-container">
      <div className="raft__mobile-banner">
        <Logo />
        <div className="raft__mobile-banner__text-container">
          <Typography variant="body" color="text-secondary">
            Mobile support is not yet available, but will be included at a later time.
          </Typography>
          <br />
          <Typography variant="body" color="text-secondary">
            Thank you for your understanding.
          </Typography>

          <div className="raft__mobile-banner__action">
            <Button variant="primary" size="large" text="Read more about Raft" onClick={onActionClick} />
          </div>
        </div>
      </div>
    </div>
  );
};
export default MobileBanner;
