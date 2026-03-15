import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setLocale, t as translate, type Locale } from '../i18n';

const LOCALE_KEY = '@delivery_locale';

interface I18nContextValue {
  locale: Locale;
  setLocaleAndSave: (locale: Locale) => Promise<void>;
  t: (key: keyof typeof import('../i18n/translations').translations.en) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    AsyncStorage.getItem(LOCALE_KEY).then((saved) => {
      if (saved && (saved === 'en' || saved === 'ru' || saved === 'tg')) {
        setLocaleState(saved);
        setLocale(saved);
      }
    });
  }, []);

  useEffect(() => {
    setLocale(locale);
  }, [locale]);

  const setLocaleAndSave = useCallback(async (newLocale: Locale) => {
    setLocaleState(newLocale);
    setLocale(newLocale);
    await AsyncStorage.setItem(LOCALE_KEY, newLocale);
  }, []);

  const t = useCallback(
    (key: keyof typeof import('../i18n/translations').translations.en) => {
      return translate(key);
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocaleAndSave, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
