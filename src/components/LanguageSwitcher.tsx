"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import {
  localeFlagCodes,
  localeLabels,
  locales,
  type Locale,
} from "@/i18n/routing";

type Props = {
  onLocaleChange?: (locale: Locale) => void;
};

export function LanguageSwitcher({ onLocaleChange }: Props) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [pending, startTransition] = useTransition();

  function switchLocale(next: Locale) {
    if (next === locale) return;
    onLocaleChange?.(next);
    startTransition(() => {
      router.replace(
        // Preserve dynamic segments (e.g. /ideas/[id]) when switching locale
        // @ts-expect-error — pathname + params always match the current route
        { pathname, params },
        { locale: next },
      );
      router.refresh();
    });
  }

  return (
    <div
      className={`space-y-1.5 ${pending ? "pointer-events-none opacity-70" : ""}`}
      role="listbox"
      aria-label="Language"
      aria-busy={pending}
    >
      {locales.map((code) => {
        const active = code === locale;
        const flag = localeFlagCodes[code];
        return (
          <button
            key={code}
            type="button"
            role="option"
            aria-selected={active}
            disabled={pending}
            onClick={() => switchLocale(code)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
              active
                ? "bg-supp-red text-white"
                : "bg-supp-soft text-supp-ink hover:bg-black/5"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/flags/${flag}.png`}
              alt=""
              width={20}
              height={15}
              className="h-[15px] w-5 shrink-0 rounded-[2px] object-cover shadow-sm"
            />
            <span className="flex-1 font-medium">{localeLabels[code]}</span>
            {active && (
              <span className="text-xs font-semibold opacity-90" aria-hidden>
                ✓
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
