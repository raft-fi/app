import { distinctUntilChanged } from 'rxjs';
import { state, useStateObservable } from '@react-rxjs/core';
import { createSignal } from '@react-rxjs/utils';
import { useEffect } from 'react';

export type Locale = 'en' | 'zh';

export const DEFAULT_LOCALE = 'en';

// add this to translation when we have it
export const LOCALE_CODE = {
  en: 'EN',
  zh: '中文',
};

const [rawLocale$, setLocale] = createSignal<Locale>();
const locale$ = rawLocale$.pipe(distinctUntilChanged());
const state$ = state(locale$, 'en');

const setStorageLocale = (locale: Locale) => {
  localStorage.setItem('raft-app-language', locale);
  setLocale(locale);
};

const getLocaleOnLoad = () => {
  const locale = localStorage.getItem('raft-app-language');
  if ((locale && locale === 'en') || locale === 'zh') {
    setStorageLocale(locale);
  } else {
    const browserLanguage = navigator.language;

    if (browserLanguage.startsWith('zh')) {
      setStorageLocale('zh');
    } else if (browserLanguage.startsWith('en')) {
      setStorageLocale('en');
    } else {
      setStorageLocale(DEFAULT_LOCALE);
    }
  }
};

getLocaleOnLoad();

export function useLocale(): [Locale, (value: Locale) => void] {
  const locale = useStateObservable(state$);

  useEffect(() => {
    getLocaleOnLoad();
  }, []);

  return [locale, setStorageLocale];
}
