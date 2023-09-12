import { memo, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Header as HeaderBase } from 'tempus-ui';
import { Nullable } from '../../interfaces';
import { Typography } from '../shared';
import RaftLogo from '../Logo/RaftLogo';
import Wallet from '../Wallet';

import './Header.scss';

const SKIP_NETWORK_CHECKING_PAGES = ['bridge'];

const Header = () => {
  const location = useLocation();

  const [, setMenuOpened] = useState(false);
  const [currentPage, setCurrentPage] = useState<Nullable<string>>('');

  useEffect(() => {
    const sanitizedPath = location.pathname.replace(/\/$/, '');
    switch (sanitizedPath) {
      case '':
        setCurrentPage('your-position');
        break;
      case '/savings':
        setCurrentPage('savings');
        break;
      case '/bridge':
        setCurrentPage('bridge');
        break;
      default:
        setCurrentPage(null);
    }
  }, [location]);

  const logo = useMemo(() => <RaftLogo />, []);

  const navItems = useMemo(
    () => [
      <div key="navitem-your-position" className="raft__header__nav-item">
        <Link to="/">
          <Typography
            variant="menu-item"
            className={`${
              currentPage === 'your-position' ? 'raft__header__link-active' : 'raft__header__link-inactive'
            }`}
          >
            Your Position
          </Typography>
        </Link>
      </div>,
      <div key="navitem-savings" className="raft__header__nav-item">
        <Link to="/savings">
          <Typography
            variant="menu-item"
            className={`${currentPage === 'savings' ? 'raft__header__link-active' : 'raft__header__link-inactive'}`}
          >
            Earn
          </Typography>
        </Link>
      </div>,
      <div key="navitem-bridge" className="raft__header__nav-item">
        <Link to="/bridge">
          <Typography
            variant="menu-item"
            className={`${currentPage === 'bridge' ? 'raft__header__link-active' : 'raft__header__link-inactive'}`}
          >
            Bridge
          </Typography>
        </Link>
      </div>,
      <Wallet key="navitem-wallet" skipNetworkChecking={SKIP_NETWORK_CHECKING_PAGES.includes(currentPage ?? '')} />,
    ],
    [currentPage],
  );

  return (
    <div className="raft__header">
      <div className="raft__header__container">
        <HeaderBase logo={logo} navItems={navItems} menuItems={[]} menuOpened={false} setMenuOpened={setMenuOpened} />
      </div>
    </div>
  );
};

export default memo(Header);
