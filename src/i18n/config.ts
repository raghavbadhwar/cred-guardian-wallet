import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from './locales/en/common.json';
import enWallet from './locales/en/wallet.json';
import enVerify from './locales/en/verify.json';
import enSettings from './locales/en/settings.json';

import hiCommon from './locales/hi/common.json';
import hiWallet from './locales/hi/wallet.json';
import hiVerify from './locales/hi/verify.json';
import hiSettings from './locales/hi/settings.json';

const resources = {
  en: {
    common: enCommon,
    wallet: enWallet,
    verify: enVerify,
    settings: enSettings,
  },
  hi: {
    common: hiCommon,
    wallet: hiWallet,
    verify: hiVerify,
    settings: hiSettings,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    ns: ['common', 'wallet', 'verify', 'settings'],
    defaultNS: 'common',
  });

export default i18n;