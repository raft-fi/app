import { memo } from 'react';
import { Link } from 'tempus-ui';
import { Link as LocalNav } from 'react-router-dom';
import { DISCORD_INVITE_URL, GITBOOK_URL, GITHUB_URL, TWITTER_URL } from '../../constants';
import { Icon, Typography } from '../shared';

import './Footer.scss';

const Footer = (): JSX.Element => {
  return (
    <div className="raft__footer">
      <LocalNav to="/terms-and-conditions">
        <Typography variant="body" weight="medium" color="text-secondary">
          Terms
        </Typography>
      </LocalNav>
      <LocalNav to="/privacy">
        <Typography variant="body" weight="medium" color="text-secondary">
          Privacy
        </Typography>
      </LocalNav>
      <div className="raft__footer__separator" />
      <Link href={TWITTER_URL}>
        <Icon variant="twitter" size={20} />
      </Link>
      <Link href={DISCORD_INVITE_URL}>
        <Icon variant="discord" size={20} />
      </Link>
      <Link href={GITHUB_URL}>
        <Icon variant="github" size={20} />
      </Link>
      <Link href={GITBOOK_URL}>
        <Icon variant="gitbook" size={20} />
      </Link>
    </div>
  );
};

export default memo(Footer);
