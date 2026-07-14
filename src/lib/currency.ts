export type CurrencyCode =
  | "HKD"
  | "CNY"
  | "USD"
  | "EUR"
  | "JPY"
  | "KRW"
  | "GBP"
  | "SGD"
  | "IDR";

export type CurrencyOption = {
  code: CurrencyCode;
  symbol: string;
  name: string;
};

/** Idea fees are stored in HKD. */
export const BASE_CURRENCY: CurrencyCode = "HKD";

export const CURRENCIES: CurrencyOption[] = [
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "KRW", symbol: "₩", name: "Korean Won" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
];

/** Approximate conversion rates from 1 HKD. */
const ratesFromHkd: Record<CurrencyCode, number> = {
  HKD: 1,
  CNY: 0.92,
  USD: 0.128,
  EUR: 0.118,
  JPY: 19.5,
  KRW: 175,
  GBP: 0.1,
  SGD: 0.172,
  IDR: 2050,
};

export const CURRENCY_STORAGE_KEY = "supp-preferred-currency";

export function isCurrencyCode(value: string): value is CurrencyCode {
  return CURRENCIES.some((c) => c.code === value);
}

export function getPreferredCurrency(): CurrencyCode {
  if (typeof window === "undefined") return BASE_CURRENCY;
  try {
    const raw = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (raw && isCurrencyCode(raw)) return raw;
  } catch {
    // ignore
  }
  return BASE_CURRENCY;
}

export function setPreferredCurrency(code: CurrencyCode) {
  try {
    localStorage.setItem(CURRENCY_STORAGE_KEY, code);
    window.dispatchEvent(
      new CustomEvent("supp-currency-change", { detail: code }),
    );
  } catch {
    // ignore
  }
}

export function convertFromHkd(amountHkd: number, to: CurrencyCode): number {
  return amountHkd * ratesFromHkd[to];
}

export function formatFee(
  amountHkd: number,
  currency: CurrencyCode,
  freeLabel: string,
): string {
  if (amountHkd <= 0) return freeLabel;
  const option = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];
  const converted = convertFromHkd(amountHkd, currency);
  const digits = currency === "JPY" || currency === "KRW" || currency === "IDR" ? 0 : 2;
  const value = converted.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
  return `${option.symbol}${value}`;
}
