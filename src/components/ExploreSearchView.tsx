"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { localizedIdea, type Idea, type SearchFilters } from "@/data/mock-ideas";
import {
  DEFAULT_SEARCH_FILTERS,
  filterIdeas,
  SEARCH_CATEGORIES,
  SEARCH_CITIES,
  SEARCH_DURATIONS,
  SEARCH_FEES,
  SEARCH_WEATHERS,
} from "@/lib/idea-filters";

export function ExploreSearchView({ ideas }: { ideas: Idea[] }) {
  const t = useTranslations("explore");
  const locale = useLocale();
  const [mode, setMode] = useState<"filters" | "results">("filters");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({
    ...DEFAULT_SEARCH_FILTERS,
  });

  const results = useMemo(
    () => filterIdeas(ideas, { ...filters, query }),
    [ideas, filters, query],
  );

  if (mode === "results") {
    return (
      <div className="min-h-full bg-[#f3f3f3] text-supp-ink">
        <div className="sticky top-12 z-20 flex items-center gap-3 border-b border-black/10 bg-[#ececec] px-4 py-3">
          <button
            type="button"
            onClick={() => setMode("filters")}
            className="text-lg leading-none text-black/70"
            aria-label={t("back")}
          >
            ←
          </button>
          <h1 className="text-sm font-semibold tracking-wide">{t("resultsTitle")}</h1>
        </div>

        <ul className="divide-y divide-black/8 bg-white">
          {results.length === 0 ? (
            <li className="px-5 py-16 text-center text-sm text-supp-muted">
              {t("empty")}
            </li>
          ) : (
            results.map((idea) => {
              const L = localizedIdea(idea, locale);
              return (
                <li key={idea.id}>
                  <Link
                    href={`/ideas/${idea.id}`}
                    className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-black/[0.03]"
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                      <Image
                        src={idea.image}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium leading-snug">
                        {L.title}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-supp-muted">
                        {L.categories.join(" · ")} · {idea.durationMin}
                        {t("minutesShort")}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })
          )}
        </ul>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100dvh-7.5rem)] overflow-hidden">
      <Image
        src="/images/hero-mountain.jpg"
        alt=""
        fill
        priority
        className="object-cover"
        sizes="500px"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/85 to-black/45" />

      <div className="relative z-10 space-y-5 px-4 pb-8 pt-5 animate-fade-up">
        <div className="flex items-center gap-3">
          <Link
            href="/explore"
            className="text-lg leading-none text-white/80"
            aria-label={t("back")}
          >
            ←
          </Link>
          <h1 className="text-base font-semibold text-white">{t("manualSearch")}</h1>
        </div>

        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-full border-0 bg-[#d9d9d9] py-3.5 pe-12 ps-5 text-sm text-black outline-none placeholder:text-black/45"
          />
          <button
            type="button"
            onClick={() => setMode("results")}
            className="absolute end-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black text-white"
            aria-label={t("start")}
          >
            ⌕
          </button>
        </div>

        <div className="space-y-2.5">
          <FilterRow
            label={t("city")}
            value={filters.city ?? "Hong Kong"}
            options={SEARCH_CITIES.map((c) => ({
              value: c,
              label: c === "any" ? t("any") : c,
            }))}
            onChange={(city) => setFilters((f) => ({ ...f, city }))}
          />
          <FilterRow
            label={t("weather")}
            value={filters.weather ?? "any"}
            options={SEARCH_WEATHERS.map((w) => ({
              value: w,
              label: t(`weatherOptions.${w}`),
            }))}
            onChange={(weather) => setFilters((f) => ({ ...f, weather }))}
          />
          <FilterRow
            label={t("fee")}
            value={filters.fee ?? "any"}
            options={SEARCH_FEES.map((fee) => ({
              value: fee,
              label: t(`feeOptions.${fee}`),
            }))}
            onChange={(fee) => setFilters((f) => ({ ...f, fee }))}
          />
          <FilterRow
            label={t("duration")}
            value={filters.duration ?? "any"}
            options={SEARCH_DURATIONS.map((d) => ({
              value: d,
              label: t(`durationOptions.${d}`),
            }))}
            onChange={(duration) => setFilters((f) => ({ ...f, duration }))}
          />
          <FilterRow
            label={t("category")}
            value={filters.category ?? "any"}
            options={SEARCH_CATEGORIES.map((c) => ({
              value: c,
              label: c === "any" ? t("any") : t(`categories.${c}`),
            }))}
            onChange={(category) => setFilters((f) => ({ ...f, category }))}
          />

          <ToggleRow
            label={t("travellerMode")}
            hint={t("travellerModeHint")}
            on={Boolean(filters.travellerMode)}
            onChange={(travellerMode) =>
              setFilters((f) => ({ ...f, travellerMode }))
            }
            onLabel={t("modeOn")}
            offLabel={t("modeOff")}
          />
          <ToggleRow
            label={t("introvertMode")}
            hint={t("introvertModeHint")}
            on={Boolean(filters.introvertMode)}
            onChange={(introvertMode) =>
              setFilters((f) => ({ ...f, introvertMode }))
            }
            onLabel={t("modeOn")}
            offLabel={t("modeOff")}
          />
        </div>

        <button
          type="button"
          onClick={() => setMode("results")}
          className="mx-auto block w-[70%] rounded-full bg-supp-red py-3.5 text-center text-base font-semibold text-white shadow-lg shadow-red-900/30 transition hover:bg-supp-red-dark"
        >
          {t("start")}
        </button>
      </div>
    </div>
  );
}

function FilterRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const selectedLabel =
    options.find((o) => o.value === value)?.label ?? value;

  return (
    <label className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-sm text-white/90">{label}</span>
      <div className="relative flex-1">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label}: ${selectedLabel}`}
          className="h-10 w-full appearance-none rounded-lg border-0 bg-[#d9d9d9] px-3 pe-9 text-sm font-medium text-black outline-none"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span
          className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-xs text-black/45"
          aria-hidden
        >
          ▾
        </span>
      </div>
    </label>
  );
}

function ToggleRow({
  label,
  hint,
  on,
  onChange,
  onLabel,
  offLabel,
}: {
  label: string;
  hint: string;
  on: boolean;
  onChange: (value: boolean) => void;
  onLabel: string;
  offLabel: string;
}) {
  return (
    <div className="rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white">{label}</p>
          <p className="mt-0.5 text-[11px] leading-snug text-white/60">{hint}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          onClick={() => onChange(!on)}
          className={`relative h-8 w-[4.75rem] shrink-0 rounded-full transition ${
            on ? "bg-supp-red" : "bg-[#d9d9d9]"
          }`}
        >
          <span
            className={`pointer-events-none absolute inset-y-0 flex items-center px-2 text-[10px] font-semibold ${
              on ? "justify-start text-white" : "justify-end text-black/55"
            }`}
          >
            {on ? onLabel : offLabel}
          </span>
          <span
            className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${
              on ? "left-[2.85rem]" : "left-1"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
