import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { en, ru, tj } from '../i18n/translations';

const STORAGE_KEY = '@app_language';

const translations = { en, ru, tj };

export const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('ru');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'en' || saved === 'ru' || saved === 'tj') {
        setLanguage(saved);
      }
      setLoaded(true);
    });
  }, []);

  const setLanguageAndSave = (lang) => {
    if (lang !== 'en' && lang !== 'ru' && lang !== 'tj') return;
    setLanguage(lang);
    AsyncStorage.setItem(STORAGE_KEY, lang);
  };

  const t = (key) => {
    const dict = translations[language] || en;
    return dict[key] ?? key;
  };

  const value = {
    language,
    setLanguage: setLanguageAndSave,
    t,
    loaded,
    languages: [
      { code: 'en', label: 'English' },
      { code: 'ru', label: 'Русский' },
      { code: 'tj', label: 'Тоҷикӣ' },
    ],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
