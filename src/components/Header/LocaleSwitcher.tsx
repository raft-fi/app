import { memo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ButtonWrapper } from '@tempusfinance/common-ui';
import { useLocale } from '../../hooks';
import { SupportedLocale, SUPPORTED_LOCALES } from '../../i18n';
import { Icon, Typography } from '../shared';

const LocaleSwitcher = () => {
  const { t } = useTranslation();
  const [, setLocale] = useLocale();
  const [menuOpened, setMenuOpened] = useState<boolean>(false);

  const onSelect = useCallback(
    (locale: SupportedLocale) => {
      setMenuOpened(false);
      setLocale(locale);
    },
    [setLocale],
  );
  const onToggleMenu = useCallback(() => setMenuOpened(prev => !prev), []);

  return (
    <div className="raft__locale-switcher">
      <ButtonWrapper className="raft__locale-switcher__button" onClick={onToggleMenu}>
        <Icon variant="globe" size={20} />
        <Typography variant="heading2" className="raft__header__link-inactive">
          {t('LocaleSwitcher.localeCode')}
        </Typography>
        <Icon variant={menuOpened ? 'chevron-up' : 'chevron-down'} />
      </ButtonWrapper>
      {menuOpened && (
        <>
          <div className="raft__locale-switcher__backdrop" onClick={onToggleMenu} />
          <div className="raft__locale-switcher__menu">
            <ul>
              {SUPPORTED_LOCALES.map(locale => (
                <li key={`locale-switcher-item-${locale}`}>
                  <ButtonWrapper onClick={() => onSelect(locale)}>
                    <Typography variant="heading2">{t('LocaleSwitcher.localeLabel', { lng: locale })}</Typography>
                  </ButtonWrapper>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default memo(LocaleSwitcher);
