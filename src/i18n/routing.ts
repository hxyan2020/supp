import { defineRouting } from "next-intl/routing";

export const locales = [
  "en",
  "zh",
  "fr",
  "es",
  "ar",
  "ru",
  "ja",
  "ko",
  "id",
] as const;

export type Locale = (typeof locales)[number];

export const localeLabels: Record<Locale, string> = {
  en: "English",
  zh: "中文",
  fr: "Français",
  es: "Español",
  ar: "العربية",
  ru: "Русский",
  ja: "日本語",
  ko: "한국어",
  id: "Bahasa Indonesia",
};

/** ISO 3166-1 alpha-2 codes for language option flags */
export const localeFlagCodes: Record<Locale, string> = {
  en: "us",
  zh: "cn",
  fr: "fr",
  es: "es",
  ar: "sa",
  ru: "ru",
  ja: "jp",
  ko: "kr",
  id: "id",
};

export const routing = defineRouting({
  locales,
  defaultLocale: "en",
  localePrefix: "always",
});
