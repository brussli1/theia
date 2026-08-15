"use client";

import { LOCALE_COOKIE } from "../lib/cookie";
import type { Locale } from "../lib/i18n";

const LOCALE_NAMES: Record<Locale, string> = { es: "Español", en: "English" };

export default function LocaleSwitcher({ currentLocale }: { currentLocale: Locale }) {
  function setLocale(locale: Locale) {
    if (locale === currentLocale) {
      return;
    }
    document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;samesite=lax`;
    window.location.reload();
  }

  return (
    <div className="flex items-center gap-1 rounded-full border border-slate-300 p-0.5 text-xs">
      {(["es", "en"] as Locale[]).map((locale) => (
        <button
          key={locale}
          type="button"
          aria-label={LOCALE_NAMES[locale]}
          aria-pressed={locale === currentLocale}
          onClick={() => setLocale(locale)}
          className={`rounded-full px-2 py-0.5 font-medium uppercase ${
            locale === currentLocale
              ? "bg-brand-600 text-white"
              : "text-slate-500 hover:text-brand-700"
          }`}
        >
          {locale}
        </button>
      ))}
    </div>
  );
}
