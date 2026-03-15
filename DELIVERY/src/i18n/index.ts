import { translations, type Locale } from './translations';

let currentLocale: Locale = 'en';

export { translations };
export type { Locale };

export function setLocale(locale: Locale) {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

export function t(key: keyof typeof translations.en): string {
  const dict = translations;
  if (!dict) return String(key);
  const localeDict = dict[currentLocale as keyof typeof dict];
  const fallback = dict.en;
  return (localeDict?.[key as keyof typeof localeDict] ?? fallback?.[key] ?? key) as string;
}
