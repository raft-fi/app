import { memo } from 'react';
import { Link } from 'tempus-ui';
import { Link as LocalNav } from 'react-router-dom';
import { DISCORD_INVITE_URL, GITBOOK_URL, GITHUB_URL, TWITTER_URL } from '../../constants';
import { Icon, Typography } from '../shared';

import './Footer.scss';

const Footer = (): JSX.Element => {
  return (
    <div className="raft__footer" title="Terms and conditions">
      <div className="raft__footer__page">
        <LocalNav to="/terms-and-conditions">
          <Typography variant="body" weight="medium" color="text-secondary">
            Terms
          </Typography>
        </LocalNav>
        <LocalNav to="/privacy" title="Privacy policy">
          <Typography variant="body" weight="medium" color="text-secondary">
            Privacy
          </Typography>
        </LocalNav>
      </div>
      <div className="raft__footer__separator" />
      <div className="raft__footer__links">
        <Link href={TWITTER_URL} title="Twitter">
          <Icon variant="twitter" size={20} />
        </Link>
        <Link href={DISCORD_INVITE_URL} title="Discord">
          <Icon variant="discord" size={20} />
        </Link>
        <Link href={GITHUB_URL} title="Github">
          <Icon variant="github" size={20} />
        </Link>
        <Link href={GITBOOK_URL} title="Gitbook">
          <Icon variant="gitbook" size={20} />
        </Link>
      </div>
    </div>
  );
};

export default memo(Footer);
