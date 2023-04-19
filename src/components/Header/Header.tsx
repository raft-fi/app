import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { ButtonWrapper, Header as HeaderBase, Link } from 'tempus-ui';
import { Icon, Typography } from '../shared';
import RaftLogo from '../Logo/RaftLogo';

import './Header.scss';

const Header = () => {
  const [currentPage, setCurrentPage] = useState<string | null>(null);
  const [menuOpened, setMenuOpened] = useState(false);

  useEffect(() => {
    const sanitizedPath = window.location.pathname.replace(/\/$/, '');
    switch (sanitizedPath) {
      case '':
        setCurrentPage('dashboard');
        break;
      case '/redeem':
        setCurrentPage('redeem');
        break;
      default:
        setCurrentPage(null);
    }
  }, []);

  const handleLinkClick = useCallback(() => {
    setTimeout(() => setMenuOpened(false), 200);
  }, []);

  const logo = useMemo(() => <RaftLogo />, []);
  const navItems = useMemo(
    () => [
      <Link key="navitem-dashboard" href="/">
        <Typography
          variant="subtitle"
          weight="medium"
          className={`${currentPage === 'dashboard' ? 'raft__header__link-active' : 'raft__header__link-inactive'}`}
        >
          Dashboard
        </Typography>
      </Link>,
      <Link key="navitem-redeem" href="/redeem">
        <Typography
          variant="subtitle"
          weight="medium"
          className={`${currentPage === 'redeem' ? 'raft__header__link-active' : 'raft__header__link-inactive'}`}
        >
          Redeem
        </Typography>
      </Link>,
      <Link key="navitem-locale" href="/">
        <Typography variant="subtitle" weight="medium" className="raft__header__link-inactive">
          EN
        </Typography>
      </Link>,
      <ButtonWrapper key="navitem-connect" disabled={true}>
        <Typography variant="body-primary" weight="medium">
          Connect
        </Typography>
      </ButtonWrapper>,
    ],
    [currentPage],
  );
  const menuItems = useMemo(
    () => [
      <Link key="menu-item-dashboard" className="raft__header__menu-link" href="/" onClick={handleLinkClick}>
        <Typography variant="body-primary" weight="medium">
          Dashboard
        </Typography>
        <Icon variant="arrow-right" />
      </Link>,
      <Link key="menu-item-redeem" className="raft__header__menu-link" href="/redeem" onClick={handleLinkClick}>
        <Typography variant="body-primary" weight="medium">
          Redeem
        </Typography>
        <Icon variant="arrow-right" />
      </Link>,
    ],
    [handleLinkClick],
  );

  return (
    <HeaderBase
      logo={logo}
      navItems={navItems}
      menuItems={menuItems}
      menuOpened={menuOpened}
      setMenuOpened={setMenuOpened}
    />
  );
};

export default memo(Header);
