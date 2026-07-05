"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { localeLabels, locales, type Locale } from "@/i18n/routing";

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  function handleChange(nextLocale: string) {
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <select
      value={locale}
      onChange={(e) => handleChange(e.target.value)}
      className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none ring-emerald-500 focus:ring-2"
      aria-label="Language"
    >
      {locales.map((code) => (
        <option key={code} value={code}>
          {localeLabels[code]}
        </option>
      ))}
    </select>
  );
}
