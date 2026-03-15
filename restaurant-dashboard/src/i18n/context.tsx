"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import enTranslations from "./translations/en.json";
import ruTranslations from "./translations/ru.json";

export type Locale = "en" | "ru";

export const LOCALE_KEY = "restaurant-dashboard-locale";

interface Translations {
  [key: string]: string | Translations;
}

function getNested(obj: Translations, path: string): string | undefined {
  const keys = path.split(".");
  let current: string | Translations | undefined = obj;
  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = current[key] as Translations;
    } else {
      return undefined;
    }
  }
  return typeof current === "string" ? current : undefined;
}

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const translations = {
  en: enTranslations as Translations,
  ru: ruTranslations as Translations,
};

function isLocale(value: string | null | undefined): value is Locale {
  return value === "en" || value === "ru";
}

function persistLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCALE_KEY, locale);
  document.cookie = `${LOCALE_KEY}=${locale}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.lang = locale;
}

export function LanguageProvider({
  children,
  initialLocale = "en",
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return initialLocale;

    const stored = localStorage.getItem(LOCALE_KEY);
    if (isLocale(stored)) return stored;

    return window.navigator.language.toLowerCase().startsWith("ru") ? "ru" : initialLocale;
  });

  useEffect(() => {
    persistLocale(locale);
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    persistLocale(newLocale);
    setLocaleState((currentLocale) =>
      currentLocale === newLocale ? currentLocale : newLocale
    );
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const text =
        getNested(translations[locale], key) ??
        getNested(translations.en, key) ??
        key;
      if (!params) return text;
      return Object.entries(params).reduce(
        (acc, [k, v]) =>
          acc.replace(new RegExp(`\\{${k}\\}`, "g"), String(v)),
        text
      );
    },
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useTranslation must be used within LanguageProvider");
  return ctx;
}
