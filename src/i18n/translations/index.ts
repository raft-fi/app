import { SupportedLocale } from '../i18nTypes';
import enGB from './en-GB.json';
import zh from './zh.json';
import zz from './zz.json';

const NAMESPACE = 'translation';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const translations: Record<SupportedLocale, { [NAMESPACE]: any }> = {
  'en-GB': {
    [NAMESPACE]: enGB,
  },
  zh: {
    [NAMESPACE]: zh,
  },
  zz: {
    [NAMESPACE]: zz,
  },
};

export default translations;
