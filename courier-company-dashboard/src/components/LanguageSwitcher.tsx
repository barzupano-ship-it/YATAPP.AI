"use client";

import { Globe } from "lucide-react";
import { useTranslation } from "@/i18n/context";
import type { Locale } from "@/i18n/context";

const LOCALES: { code: Locale; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "ru", label: "RU" },
  { code: "tg", label: "ТҶ" },
];

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useTranslation();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Globe className="w-4 h-4 text-slate-500 shrink-0" />
      <div className="flex gap-1">
        {LOCALES.map(({ code, label }) => (
          <button
            key={code}
            onClick={() => setLocale(code)}
            className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
              locale === code
                ? "bg-emerald-600 text-white"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
