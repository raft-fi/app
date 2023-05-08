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
            variant="subtitle"
            weight="medium"
            className={`${currentPage === 'dashboard' ? 'raft__header__link-active' : 'raft__header__link-inactive'}`}
          >
            Dashboard
          </Typography>
        </Link>
      </div>,
      <div key="navitem-redeem" className="raft__header__nav-item">
        <Link to="/redeem">
          <Typography
            variant="subtitle"
            weight="medium"
            className={`${currentPage === 'redeem' ? 'raft__header__link-active' : 'raft__header__link-inactive'}`}
          >
            Redeem
          </Typography>
        </Link>
      </div>,
      //<LocaleSwitcher key="navitem-locale" />,
      <Wallet key="navitem-wallet" />,
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentPage, locale],
  );
  const menuItems = useMemo(() => {
    switch (openedSubmenu) {
      case 'locale':
        return SUPPORTED_LOCALES.map(l => (
          <ButtonWrapper key={`menu-item-${l}`} className="raft__header__menu-link" onClick={() => onSelectLocale(l)}>
            <Typography variant="body-primary" weight="medium">
              {t('LocaleSwitcher.localeLabel', { lng: l })}
            </Typography>
            <Icon variant="arrow-right" />
          </ButtonWrapper>
        ));
      default:
        return [
          <Link key="menu-item-dashboard" className="raft__header__menu-link" to="/" onClick={handleLinkClick}>
            <Typography variant="body-primary" weight="medium">
              Dashboard
            </Typography>
            <Icon variant="arrow-right" />
          </Link>,
          <Link key="menu-item-redeem" className="raft__header__menu-link" to="/redeem" onClick={handleLinkClick}>
            <Typography variant="body-primary" weight="medium">
              Redeem
            </Typography>
            <Icon variant="arrow-right" />
          </Link>,
          /*
          <ButtonWrapper key="menu-item-locale" className="raft__header__menu-link" onClick={handleLocaleClick}>
            <div className="raft__header__menu-link-label">
              <Icon variant="globe" size={20} />
              <Typography variant="body-primary" weight="medium">
                {t('LocaleSwitcher.localeLabel')}
              </Typography>
            </div>
            <Icon variant="arrow-right" />
          </ButtonWrapper>,
          */
        ];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleLinkClick, handleLocaleClick, locale, onSelectLocale, openedSubmenu, t]);

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
