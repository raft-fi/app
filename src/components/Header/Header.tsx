import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ButtonWrapper, Header as HeaderBase } from 'tempus-ui';
import { SupportedLocale, SUPPORTED_LOCALES } from '../../i18n';
import { Icon, Typography } from '../shared';
import { useLocale } from '../../hooks';
import { Nullable } from '../../interfaces';
import RaftLogo from '../Logo/RaftLogo';
import Wallet from '../Wallet';
import LocaleSwitcher from './LocaleSwitcher';

import './Header.scss';

const Header = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const [locale, setLocale] = useLocale();
  const [currentPage, setCurrentPage] = useState<Nullable<string>>(null);
  const [menuOpened, setMenuOpened] = useState(false);
  const [openedSubmenu, setOpenedSubmenu] = useState<string>('');

  useEffect(() => {
    const sanitizedPath = location.pathname.replace(/\/$/, '');
    switch (sanitizedPath) {
      case '':
        setCurrentPage('dashboard');
        break;
      case '/redeem':
        setCurrentPage('redeem');
        break;
      case '/stats':
        setCurrentPage('stats');
        break;
      default:
        setCurrentPage(null);
    }
  }, [location]);

  useEffect(() => {
    if (!menuOpened) {
      setOpenedSubmenu('');
    }
  }, [menuOpened]);

  const handleLinkClick = useCallback(() => {
    setTimeout(() => setMenuOpened(false), 200);
  }, []);

  const handleLocaleClick = useCallback(() => {
    setTimeout(() => setOpenedSubmenu('locale'), 200);
  }, []);

  const onSelectLocale = useCallback(
    (locale: SupportedLocale) => {
      setMenuOpened(false);
      setLocale(locale);
    },
    [setLocale],
  );

  const logo = useMemo(() => <RaftLogo />, []);
  const navItems = useMemo(
    () => [
      <div key="navitem-dashboard" className="raft__header__nav-item">
        <Link to="/">
          <Typography
            variant="heading2"
            className={`${currentPage === 'dashboard' ? 'raft__header__link-active' : 'raft__header__link-inactive'}`}
          >
            Your position
          </Typography>
        </Link>
      </div>,
      <div key="navitem-stats" className="raft__header__nav-item">
        <Link to="/stats">
          <Typography
            variant="heading2"
            className={`${currentPage === 'stats' ? 'raft__header__link-active' : 'raft__header__link-inactive'}`}
          >
            Stats
          </Typography>
        </Link>
      </div>,
      <Wallet key="navitem-wallet" />,
    ],
    [currentPage],
  );
  const menuItems = useMemo(() => {
    switch (openedSubmenu) {
      case 'locale':
        return SUPPORTED_LOCALES.map(l => (
          <ButtonWrapper key={`menu-item-${l}`} className="raft__header__menu-link" onClick={() => onSelectLocale(l)}>
            <Typography variant="body">{t('LocaleSwitcher.localeLabel', { lng: l })}</Typography>
            <Icon variant="arrow-right" />
          </ButtonWrapper>
        ));
      default:
        return [
          <Link key="menu-item-dashboard" className="raft__header__menu-link" to="/" onClick={handleLinkClick}>
            <Typography variant="body">Dashboard</Typography>
            <Icon variant="arrow-right" />
          </Link>,
        ];
    }
  }, [handleLinkClick, onSelectLocale, openedSubmenu, t]);

  return (
    <div className="raft__header">
      <div className="raft__header__container">
        <HeaderBase
          logo={logo}
          navItems={navItems}
          menuItems={menuItems}
          menuOpened={menuOpened}
          setMenuOpened={setMenuOpened}
        />
      </div>
    </div>
  );
};

export default memo(Header);
