import { memo } from 'react';
import { Link } from 'tempus-ui';
import { Link as LocalNav } from 'react-router-dom';
import { DISCORD_INVITE_URL, GITBOOK_URL, GITHUB_URL, TWITTER_URL } from '../../constants';
import RaftLogo from '../Logo/RaftLogo';
import { Typography } from '../shared';

import './Footer.scss';

const Footer = (): JSX.Element => {
  return (
    <div className="raft__footer">
      <div className="raft__footer__container">
        <div className="raft__footer__logo">
          <RaftLogo />
        </div>
        <div className="raft__footer__links-container">
          <div className="raft__footer__links-column">
            <div className="raft__footer__link-container">
              <LocalNav className="raft__footer__link" to="/terms-and-conditions">
                <Typography variant="body" color="text-primary-inverted">
                  Terms & Conditions
                </Typography>
              </LocalNav>
            </div>
            <div className="raft__footer__link-container">
              <LocalNav className="raft__footer__link" to="/privacy">
                <Typography variant="body" color="text-primary-inverted">
                  Privacy Policy
                </Typography>
              </LocalNav>
            </div>
          </div>
          <div className="raft__footer__links-column">
            <div className="raft__footer__link-container">
              <Link className="raft__footer__link" href={TWITTER_URL}>
                <Typography variant="body" color="text-primary-inverted">
                  Twitter
                </Typography>
              </Link>
            </div>
            <div className="raft__footer__link-container">
              <Link className="raft__footer__link" href={DISCORD_INVITE_URL}>
                <Typography variant="body" color="text-primary-inverted">
                  Discord
                </Typography>
              </Link>
            </div>
          </div>
          <div className="raft__footer__links-column">
            <div className="raft__footer__link-container">
              <Link className="raft__footer__link" href={GITHUB_URL}>
                <Typography variant="body" color="text-primary-inverted">
                  GitHub
                </Typography>
              </Link>
            </div>
            <div className="raft__footer__link-container">
              <Link className="raft__footer__link" href={GITBOOK_URL}>
                <Typography variant="body" color="text-primary-inverted">
                  GitBook
                </Typography>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(Footer);
