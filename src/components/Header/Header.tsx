import { memo, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Header as HeaderBase, Link } from 'tempus-ui';
import { Nullable } from '../../interfaces';
import { Icon, Typography } from '../shared';
import RaftLogo from '../Logo/RaftLogo';
import RaftLogoMobile from '../Logo/RaftLogoMobile';
import Wallet from '../Wallet';

import './Header.scss';

const SKIP_NETWORK_CHECKING_PAGES = ['bridge', 'savings'];

const Header = () => {
  const location = useLocation();

  const [currentPage, setCurrentPage] = useState<Nullable<string>>(null);
  const [menuOpened, setMenuOpened] = useState(false);

  useEffect(() => {
    const sanitizedPath = location.pathname.replace(/\/$/, '');
    switch (sanitizedPath) {
      case '/generate':
      case '/leverage':
        setCurrentPage('your-position');
        break;
      case '/savings':
        setCurrentPage('savings');
        break;
      case '/bridge':
        setCurrentPage('bridge');
        break;
      case '/stake':
        setCurrentPage('stake');
        break;
      default:
        setCurrentPage(null);
    }
  }, [location]);

  const logo = useMemo(
    () => (
      <>
        <RaftLogo />
        <RaftLogoMobile />
      </>
    ),
    [],
  );

  const navItems = useMemo(
    () => [
      <div key="navitem-your-position" className="raft__header__nav-item">
        <Link href="/">
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
        <Link href="/savings">
          <Typography
            variant="menu-item"
            className={`${currentPage === 'savings' ? 'raft__header__link-active' : 'raft__header__link-inactive'}`}
          >
            Earn
          </Typography>
        </Link>
      </div>,
      <div key="navitem-bridge" className="raft__header__nav-item">
        <Link href="/bridge">
          <Typography
            variant="menu-item"
            className={`${currentPage === 'bridge' ? 'raft__header__link-active' : 'raft__header__link-inactive'}`}
          >
            Bridge
          </Typography>
        </Link>
      </div>,
      <div key="navitem-stake" className="raft__header__nav-item">
        <Link href="/stake">
          <Typography
            variant="menu-item"
            className={`${currentPage === 'stake' ? 'raft__header__link-active' : 'raft__header__link-inactive'}`}
          >
            Stake
          </Typography>
        </Link>
      </div>,
      <Wallet key="navitem-wallet" skipNetworkChecking={SKIP_NETWORK_CHECKING_PAGES.includes(currentPage ?? '')} />,
    ],
    [currentPage],
  );

  const menuItems = useMemo(
    () => [
      <Link key="navitem-your-position" className="raft__header__menu-link" href="/">
        <Typography variant="menu-item" weight="medium" color="text-secondary">
          Your Position
        </Typography>
        <Icon variant="arrow-right" />
      </Link>,
      <Link key="navitem-savings" className="raft__header__menu-link" href="/savings">
        <Typography variant="menu-item" weight="medium" color="text-secondary">
          Earn
        </Typography>
        <Icon variant="arrow-right" />
      </Link>,
      <Link key="navitem-bridge" className="raft__header__menu-link" href="/bridge">
        <Typography variant="menu-item" weight="medium" color="text-secondary">
          Bridge
        </Typography>
        <Icon variant="arrow-right" />
      </Link>,
      <Link key="navitem-stake" className="raft__header__menu-link" href="/stake">
        <Typography variant="menu-item" weight="medium" color="text-secondary">
          Stake
        </Typography>
        <Icon variant="arrow-right" />
      </Link>,
    ],
    [],
  );

  return (
    <div className="raft__header">
      <div className={`raft__header__container ${menuOpened ? 'raft__header__menu-opened' : ''}`}>
        <HeaderBase
          logo={logo}
          navItems={navItems}
          menuItems={menuItems}
          menuOpened={menuOpened}
          setMenuOpened={setMenuOpened}
        />
        <Wallet skipNetworkChecking={SKIP_NETWORK_CHECKING_PAGES.includes(currentPage ?? '')} />
      </div>
    </div>
  );
};

export default memo(Header);
