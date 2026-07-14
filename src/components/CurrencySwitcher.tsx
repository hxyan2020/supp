"use client";

import { useEffect, useState } from "react";
import {
  CURRENCIES,
  getPreferredCurrency,
  setPreferredCurrency,
  type CurrencyCode,
} from "@/lib/currency";

export function usePreferredCurrency() {
  const [currency, setCurrency] = useState<CurrencyCode>("HKD");

  useEffect(() => {
    setCurrency(getPreferredCurrency());
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<CurrencyCode>).detail;
      if (detail) setCurrency(detail);
      else setCurrency(getPreferredCurrency());
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === "supp-preferred-currency") setCurrency(getPreferredCurrency());
    };
    window.addEventListener("supp-currency-change", onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("supp-currency-change", onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  function update(code: CurrencyCode) {
    setPreferredCurrency(code);
    setCurrency(code);
  }

  return { currency, setCurrency: update, options: CURRENCIES };
}

export function CurrencySwitcher() {
  const { currency, setCurrency, options } = usePreferredCurrency();

  return (
    <div className="grid grid-cols-1 gap-1.5">
      {options.map((opt) => {
        const active = opt.code === currency;
        return (
          <button
            key={opt.code}
            type="button"
            onClick={() => setCurrency(opt.code)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
              active
                ? "bg-supp-red text-white"
                : "bg-supp-soft text-supp-ink hover:bg-black/5"
            }`}
          >
            <span className="w-10 shrink-0 font-semibold tabular-nums">
              {opt.symbol}
            </span>
            <span className="flex-1">
              <span className="font-medium">{opt.code}</span>
              <span className={active ? "text-white/75" : "text-supp-muted"}>
                {" · "}
                {opt.name}
              </span>
            </span>
            {active && <span className="text-xs font-semibold">✓</span>}
          </button>
        );
      })}
    </div>
  );
}
