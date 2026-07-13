"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  localizedIdea,
  type Idea,
} from "@/data/mock-ideas";

function navigationUrl(idea: Idea, locale: string) {
  if (locale === "zh") {
    return `https://uri.amap.com/navigation?to=${idea.lng},${idea.lat},${encodeURIComponent(idea.addressZh)}&mode=car&src=supp`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${idea.lat},${idea.lng}&travelmode=walking`;
}

export function MapView({ ideas: allIdeas }: { ideas: Idea[] }) {
  const t = useTranslations("map");
  const locale = useLocale();
  const ideas = useMemo(
    () => allIdeas.filter((idea) => Number.isFinite(idea.lat) && Number.isFinite(idea.lng)),
    [allIdeas],
  );
  const [selected, setSelected] = useState<Idea | null>(ideas[0] ?? null);
  const [query, setQuery] = useState("");
  const [MapInner, setMapInner] = useState<React.ComponentType<{
    ideas: Idea[];
    selected: Idea | null;
    onSelect: (idea: Idea) => void;
    locale: string;
  }> | null>(null);

  useEffect(() => {
    void import("./IdeaMap").then((mod) => setMapInner(() => mod.IdeaMap));
  }, []);

  const filtered = ideas.filter((idea) => {
    if (!query.trim()) return true;
    const L = localizedIdea(idea, locale);
    const hay = `${L.title} ${L.address} ${idea.city}`.toLowerCase();
    return hay.includes(query.trim().toLowerCase());
  });

  return (
    <div className="relative h-[calc(100dvh-7.5rem)] overflow-hidden bg-[#e8e8e8] text-supp-ink">
      <div className="absolute inset-x-3 top-3 z-20">
        <div className="flex items-center gap-2 rounded-full bg-white px-4 py-3 shadow-md">
          <span className="text-black/40">☰</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full bg-transparent text-sm outline-none placeholder:text-black/40"
          />
          <span className="text-black/35">🎙</span>
        </div>
      </div>

      <div className="absolute inset-0 z-0">
        {MapInner ? (
          <MapInner
            ideas={filtered}
            selected={selected}
            onSelect={setSelected}
            locale={locale}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[#dfe5ea] text-sm text-supp-muted">
            {t("loading")}
          </div>
        )}
      </div>

      <div className="absolute bottom-4 end-4 z-20 flex flex-col items-end gap-3">
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg shadow-lg"
          aria-label={t("locate")}
          onClick={() => selected && setSelected({ ...selected })}
        >
          ◎
        </button>
        {selected && (
          <a
            href={navigationUrl(selected, locale)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1a73e8] text-sm font-bold text-white shadow-xl"
          >
            {t("go")}
          </a>
        )}
      </div>

      {selected && (
        <div className="absolute inset-x-3 bottom-24 z-20 animate-fade-up rounded-2xl bg-white p-3 shadow-xl">
          <Link href={`/ideas/${selected.id}`} className="flex gap-3">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
              <Image
                src={selected.image}
                alt=""
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {localizedIdea(selected, locale).title}
              </p>
              <p className="mt-1 truncate text-xs text-supp-muted">
                {localizedIdea(selected, locale).address}
              </p>
              <p className="mt-1 text-[11px] text-supp-red">
                {locale === "zh" ? t("providerChina") : t("providerGoogle")}
              </p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
