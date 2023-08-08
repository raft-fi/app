import { memo, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Header as HeaderBase } from 'tempus-ui';
import { Nullable } from '../../interfaces';
import { Typography } from '../shared';
import RaftLogo from '../Logo/RaftLogo';
import Wallet from '../Wallet';

import './Header.scss';

const Header = () => {
  const location = useLocation();

  const [, setMenuOpened] = useState(false);
  const [currentPage, setCurrentPage] = useState<Nullable<string>>(null);

  useEffect(() => {
    const sanitizedPath = location.pathname.replace(/\/$/, '');
    switch (sanitizedPath) {
      case '/generate':
      case '/leverage':
        setCurrentPage('your-position');
        break;
      case '/redeem':
        setCurrentPage('redeem');
        break;
      case '/stake':
        setCurrentPage('stake');
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
      <div key="navitem-redeem" className="raft__header__nav-item">
        <Link to="/redeem">
          <Typography
            variant="menu-item"
            className={`${currentPage === 'redeem' ? 'raft__header__link-active' : 'raft__header__link-inactive'}`}
          >
            Redeem
          </Typography>
        </Link>
      </div>,
      <div key="navitem-stake" className="raft__header__nav-item">
        <Link to="/stake">
          <Typography
            variant="menu-item"
            className={`${currentPage === 'stake' ? 'raft__header__link-active' : 'raft__header__link-inactive'}`}
          >
            Stake
          </Typography>
        </Link>
      </div>,
      <Wallet key="navitem-wallet" />,
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
