"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  getTopRecommendations,
  localizedIdea,
  searchIdeas,
  type SearchFilters,
} from "@/data/mock-ideas";

const cities = ["any", "Hong Kong", "Shanghai", "Tokyo"] as const;
const weathers = ["any", "sunny", "cloudy", "rainy"] as const;
const fees = ["any", "free", "under100", "over100"] as const;
const durations = ["any", "short", "medium", "long"] as const;
const categories = [
  "any",
  "comfort",
  "taste",
  "outdoors",
  "creative",
  "social",
  "culture",
  "adrenaline",
  "wellness",
] as const;

export function ExploreView() {
  const t = useTranslations("explore");
  const locale = useLocale();
  const [mode, setMode] = useState<"home" | "results">("home");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({
    city: "any",
    weather: "any",
    fee: "any",
    duration: "any",
    category: "any",
  });

  const top10 = useMemo(() => getTopRecommendations(10), []);
  const results = useMemo(
    () => searchIdeas({ ...filters, query }),
    [filters, query],
  );

  function startExplore() {
    setMode("results");
  }

  if (mode === "results") {
    return (
      <div className="min-h-full bg-[#f3f3f3] text-supp-ink">
        <div className="sticky top-12 z-20 flex items-center gap-3 border-b border-black/10 bg-[#ececec] px-4 py-3">
          <button
            type="button"
            onClick={() => setMode("home")}
            className="text-lg leading-none text-black/70"
            aria-label="Back"
          >
            ←
          </button>
          <h1 className="text-sm font-semibold tracking-wide">{t("resultsTitle")}</h1>
        </div>

        <ul className="divide-y divide-black/8 bg-white">
          {results.length === 0 ? (
            <li className="px-5 py-16 text-center text-sm text-supp-muted">{t("empty")}</li>
          ) : (
            results.map((idea) => {
              const L = localizedIdea(idea, locale);
              return (
                <li key={idea.id}>
                  <Link
                    href={`/ideas/${idea.id}`}
                    className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-black/[0.03]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium leading-snug">{L.title}</p>
                      <p className="mt-0.5 truncate text-xs text-supp-muted">
                        {L.categories.join(" · ")} · {idea.durationMin}
                        {t("minutesShort")}
                      </p>
                    </div>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-black/20 text-black/50">
                      ✓
                    </span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full text-supp-red">
                      ♥
                    </span>
                  </Link>
                </li>
              );
            })
          )}
        </ul>

        <div className="relative mt-2 h-40 overflow-hidden">
          <Image
            src="/images/hero-mountain.jpg"
            alt=""
            fill
            className="object-cover opacity-90"
            sizes="500px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
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
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/85 to-black/40" />

      <div className="relative z-10 space-y-5 px-4 pb-8 pt-5 animate-fade-up">
        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-full border-0 bg-[#d9d9d9] py-3.5 pe-12 ps-5 text-sm text-black outline-none placeholder:text-black/45"
          />
          <button
            type="button"
            onClick={startExplore}
            className="absolute end-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black text-white"
            aria-label={t("start")}
          >
            ⌕
          </button>
        </div>

        <div className="space-y-2.5">
          <FilterRow
            label={t("city")}
            value={filters.city ?? "any"}
            options={cities.map((c) => ({
              value: c,
              label: c === "any" ? t("any") : c,
            }))}
            onChange={(city) => setFilters((f) => ({ ...f, city }))}
          />
          <FilterRow
            label={t("weather")}
            value={filters.weather ?? "any"}
            options={weathers.map((w) => ({
              value: w,
              label: t(`weatherOptions.${w}`),
            }))}
            onChange={(weather) => setFilters((f) => ({ ...f, weather }))}
          />
          <FilterRow
            label={t("fee")}
            value={filters.fee ?? "any"}
            options={fees.map((fee) => ({
              value: fee,
              label: t(`feeOptions.${fee}`),
            }))}
            onChange={(fee) => setFilters((f) => ({ ...f, fee }))}
          />
          <FilterRow
            label={t("duration")}
            value={filters.duration ?? "any"}
            options={durations.map((d) => ({
              value: d,
              label: t(`durationOptions.${d}`),
            }))}
            onChange={(duration) => setFilters((f) => ({ ...f, duration }))}
          />
          <FilterRow
            label={t("category")}
            value={filters.category ?? "any"}
            options={categories.map((c) => ({
              value: c,
              label: c === "any" ? t("any") : t(`categories.${c}`),
            }))}
            onChange={(category) => setFilters((f) => ({ ...f, category }))}
          />
        </div>

        <button
          type="button"
          onClick={startExplore}
          className="mx-auto block w-[70%] rounded-full bg-supp-red py-3.5 text-center text-base font-semibold text-white shadow-lg shadow-red-900/30 transition hover:bg-supp-red-dark animate-soft-pulse"
        >
          {t("start")}
        </button>

        <div className="space-y-1 pt-2 text-center text-[12px] leading-relaxed text-white/85">
          <p>{t("stats.database", { count: "32,187" })}</p>
          <p>{t("stats.mine", { count: 45 })}</p>
          <p>{t("stats.remaining", { count: 3 })}</p>
        </div>

        <section className="rounded-2xl bg-black/45 p-4 backdrop-blur-sm">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="text-base font-semibold">{t("forYou")}</h2>
              <p className="text-xs text-white/60">{t("forYouSub")}</p>
            </div>
            <span className="text-xs text-white/50">Top 10</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {top10.map((idea, index) => {
              const L = localizedIdea(idea, locale);
              return (
                <Link
                  key={idea.id}
                  href={`/ideas/${idea.id}`}
                  className="relative w-40 shrink-0 overflow-hidden rounded-xl"
                >
                  <div className="relative h-28">
                    <Image
                      src={idea.image}
                      alt={L.title}
                      fill
                      className="object-cover"
                      sizes="160px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <span className="absolute left-2 top-2 rounded-full bg-supp-red px-2 py-0.5 text-[10px] font-bold">
                      #{index + 1}
                    </span>
                  </div>
                  <div className="bg-black/70 p-2.5">
                    <p className="line-clamp-2 text-xs font-medium leading-snug">{L.title}</p>
                    <p className="mt-1 text-[10px] text-white/55">{idea.relevance}% match</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
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
  return (
    <label className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-sm text-white/90">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 flex-1 appearance-none rounded-lg border-0 bg-[#d9d9d9] px-3 text-sm text-black outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
