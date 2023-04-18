import { memo } from 'react';
import { Link } from 'tempus-ui';
import { DISCORD_INVITE_URL, GITBOOK_URL, GITHUB_URL, TWITTER_URL } from '../../constants';
import RaftLogo from '../Logo/RaftLogo';
import { Typography } from '../shared';

import './Footer.scss';

const Footer = (): JSX.Element => {
  return (
    <div className="rw__footer">
      <div className="rw__footer__container">
        <div className="rw__footer__logo">
          <RaftLogo />
        </div>
        <div className="rw__footer__links-container">
          <div className="rw__footer__links-column">
            <div className="rw__footer__link-container">
              <Link className="rw__footer__link" href="/terms-and-conditions">
                <Typography variant="body-primary" color="text-primary-inverted">
                  Terms & Conditions
                </Typography>
              </Link>
            </div>
            <div className="rw__footer__link-container">
              <Link className="rw__footer__link" href="/disclaimer">
                <Typography variant="body-primary" color="text-primary-inverted">
                  Disclaimer
                </Typography>
              </Link>
            </div>
          </div>
          <div className="rw__footer__links-column">
            <div className="rw__footer__link-container">
              <Link className="rw__footer__link" href={TWITTER_URL}>
                <Typography variant="body-primary" color="text-primary-inverted">
                  Twitter
                </Typography>
              </Link>
            </div>
            <div className="rw__footer__link-container">
              <Link className="rw__footer__link" href={DISCORD_INVITE_URL}>
                <Typography variant="body-primary" color="text-primary-inverted">
                  Discord
                </Typography>
              </Link>
            </div>
          </div>
          <div className="rw__footer__links-column">
            <div className="rw__footer__link-container">
              <Link className="rw__footer__link" href={GITHUB_URL}>
                <Typography variant="body-primary" color="text-primary-inverted">
                  GitHub
                </Typography>
              </Link>
            </div>
            <div className="rw__footer__link-container">
              <Link className="rw__footer__link" href={GITBOOK_URL}>
                <Typography variant="body-primary" color="text-primary-inverted">
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
