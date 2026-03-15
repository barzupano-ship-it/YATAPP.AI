"use client";

import { LanguageProvider, Locale } from "@/i18n/context";

export function Providers({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
}) {
  return <LanguageProvider initialLocale={initialLocale}>{children}</LanguageProvider>;
}
