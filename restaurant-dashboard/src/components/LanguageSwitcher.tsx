"use client";

import { useTranslation } from "@/i18n/context";

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();

  return (
    <div className="flex gap-1 p-1 rounded-lg bg-slate-800">
      <button
        onClick={() => setLocale("en")}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          locale === "en"
            ? "bg-orange-600 text-white"
            : "text-slate-400 hover:text-white"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLocale("ru")}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          locale === "ru"
            ? "bg-orange-600 text-white"
            : "text-slate-400 hover:text-white"
        }`}
      >
        RU
      </button>
    </div>
  );
}
