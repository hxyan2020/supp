"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { localeLabels, locales, type Locale } from "@/i18n/routing";

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  return (
    <select
      value={locale}
      onChange={(e) => router.replace(pathname, { locale: e.target.value })}
      className="w-full rounded-xl border border-black/10 bg-supp-soft px-3 py-2.5 text-sm text-supp-ink outline-none ring-supp-red focus:ring-2"
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
