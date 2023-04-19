import { memo, useCallback, useState } from 'react';
import { ButtonWrapper } from 'tempus-ui';
import { Locale, LOCALE_CODE, useLocale } from '../../hooks';
import { Icon, Typography } from '../shared';

const LocaleSwitcher = () => {
  const [locale, setLocale] = useLocale();
  const [menuOpened, setMenuOpened] = useState<boolean>(false);

  const onSelect = useCallback(
    (locale: Locale) => {
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
        <Typography variant="subtitle" weight="medium" className="raft__header__link-inactive">
          {LOCALE_CODE[locale]}
        </Typography>
        <Icon variant={menuOpened ? 'chevron-up' : 'chevron-down'} color="#6e898c" />
      </ButtonWrapper>
      {menuOpened && (
        <>
          <div className="raft__locale-switcher__backdrop" onClick={onToggleMenu} />
          <div className="raft__locale-switcher__menu">
            <ul>
              <li>
                <ButtonWrapper onClick={() => onSelect('en')}>
                  <Typography variant="subtitle" weight="medium">
                    English
                  </Typography>
                </ButtonWrapper>
              </li>
              <li>
                <ButtonWrapper onClick={() => onSelect('zh')}>
                  <Typography variant="subtitle" weight="medium">
                    中文
                  </Typography>
                </ButtonWrapper>
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default memo(LocaleSwitcher);
