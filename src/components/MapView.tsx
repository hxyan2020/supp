"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { usePreferredCurrency } from "@/components/CurrencySwitcher";
import { formatFee } from "@/lib/currency";
import {
  formatDistanceKm,
  formatEventDate,
  formatTimeRange,
  haversineKm,
  isIdeaInHoursWindow,
  isIdeaOnMap,
  MAP_DAY_WINDOW_HOURS,
  type LatLng,
} from "@/lib/geo";
import {
  engagementForIdea,
  localizedIdea,
  type Idea,
} from "@/data/mock-ideas";
import { navigationUrl } from "@/lib/map-address";

export function MapView({ ideas: allIdeas }: { ideas: Idea[] }) {
  const t = useTranslations("map");
  const tIdea = useTranslations("idea");
  const locale = useLocale();
  const { currency } = usePreferredCurrency();
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [locateError, setLocateError] = useState(false);

  const geoIdeas = useMemo(
    () =>
      allIdeas.filter(
        (idea) => Number.isFinite(idea.lat) && Number.isFinite(idea.lng),
      ),
    [allIdeas],
  );

  const upcomingIdeas = useMemo(
    () =>
      geoIdeas.filter((idea) =>
        isIdeaOnMap(idea.startsAt, idea.endsAt, nowMs),
      ),
    [geoIdeas, nowMs],
  );

  const ideasIn24h = useMemo(
    () =>
      geoIdeas.filter((idea) =>
        isIdeaInHoursWindow(
          idea.startsAt,
          idea.endsAt,
          MAP_DAY_WINDOW_HOURS,
          nowMs,
        ),
      ).length,
    [geoIdeas, nowMs],
  );

  const [selected, setSelected] = useState<Idea | null>(null);
  const [cardDismissed, setCardDismissed] = useState(false);
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

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocateError(false);
      },
      () => setLocateError(true),
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 10_000 },
    );
  }, []);

  const filtered = useMemo(() => {
    return upcomingIdeas.filter((idea) => {
      if (!query.trim()) return true;
      const L = localizedIdea(idea, locale);
      const hay = `${L.title} ${L.address} ${idea.city}`.toLowerCase();
      return hay.includes(query.trim().toLowerCase());
    });
  }, [upcomingIdeas, query, locale]);

  useEffect(() => {
    if (!filtered.length) {
      setSelected(null);
      return;
    }
    setSelected((prev) => {
      if (prev && filtered.some((i) => i.id === prev.id)) {
        return filtered.find((i) => i.id === prev.id) ?? null;
      }
      if (cardDismissed) return null;
      return filtered[0];
    });
  }, [filtered, cardDismissed]);

  function requestLocate() {
    if (!navigator.geolocation) {
      setLocateError(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocateError(false);
      },
      () => setLocateError(true),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  const distanceLabel =
    selected && userLocation
      ? formatDistanceKm(
          haversineKm(userLocation, {
            lat: selected.lat,
            lng: selected.lng,
          }),
        )
      : locateError
        ? t("distanceUnknown")
        : t("distanceLocating");

  return (
    <div className="relative h-[calc(100dvh-7.5rem)] overflow-hidden bg-[#e8e8e8] text-supp-ink">
      <div className="absolute inset-x-3 top-3 z-20 space-y-2">
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
        <div className="mx-auto w-fit rounded-full bg-[#141414]/70 px-3.5 py-1.5 text-center text-xs font-medium text-white shadow-md backdrop-blur-sm">
          {t("window24hCount", { count: ideasIn24h })}
        </div>
      </div>

      <div className="absolute inset-0 z-0">
        {MapInner ? (
          <MapInner
            ideas={filtered}
            selected={selected}
            onSelect={(idea) => {
              setCardDismissed(false);
              setSelected(idea);
            }}
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
          onClick={requestLocate}
        >
          ◎
        </button>
      </div>

      {selected && (
        <div className="absolute inset-x-3 bottom-24 z-20 animate-fade-up rounded-2xl border border-white/10 bg-[#141414]/70 p-3 text-white shadow-xl backdrop-blur-sm">
          <button
            type="button"
            onClick={() => {
              setCardDismissed(true);
              setSelected(null);
            }}
            className="absolute end-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-sm leading-none text-white/80 transition hover:bg-black/60 hover:text-white"
            aria-label={t("closeCard")}
          >
            ×
          </button>
          <Link href={`/ideas/${selected.id}`} className="flex gap-3 pe-7">
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
              <p className="mt-0.5 truncate text-xs text-white/55">
                {localizedIdea(selected, locale).address}
              </p>
            </div>
          </Link>

          <a
            href={navigationUrl(selected, locale)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex w-full items-center justify-center rounded-xl bg-supp-red py-3 text-sm font-semibold text-white shadow-lg shadow-red-900/30 transition hover:bg-supp-red-dark"
          >
            {t("navigate")}
          </a>

          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-3 text-[11px] text-white/80">
            <MetaRow
              icon={<UsersIcon />}
              label={t("experienced")}
              value={String(selected.experiencedCount)}
            />
            <MetaRow
              icon={<BookmarkIcon />}
              label={t("collected")}
              value={String(selected.favoritedCount)}
            />
            <MetaRow
              icon={<TicketIcon />}
              label={t("ticket")}
              value={formatFee(selected.fee, currency, tIdea("free"))}
            />
            <MetaRow
              icon={<PinIcon />}
              label={t("distance")}
              value={distanceLabel}
            />
            <MetaRow
              icon={<BoltIcon />}
              label={t("engagement")}
              value={t(`engagementLevels.${engagementForIdea(selected)}`)}
            />
            <MetaRow
              icon={<ClockIcon />}
              label={t("time")}
              value={`${formatEventDate(selected.startsAt, locale)} · ${formatTimeRange(selected.startsAt, selected.endsAt, locale)}`}
              className="col-span-2"
            />
          </div>
        </div>
      )}

      {!filtered.length && (
        <div className="absolute inset-x-3 bottom-24 z-20 rounded-2xl border border-white/10 bg-[#141414]/70 px-4 py-3 text-center text-sm text-white/70 shadow-xl backdrop-blur-sm">
          {t("noUpcoming")}
        </div>
      )}
    </div>
  );
}

function MetaRow({
  icon,
  label,
  value,
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`flex items-start gap-2 ${className}`}>
      <span className="mt-0.5 text-supp-red">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-white/40">
          {label}
        </p>
        <p className="truncate font-medium text-white/90">{value}</p>
      </div>
    </div>
  );
}

function UsersIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="3.5" />
      <path strokeLinecap="round" d="M22 21v-2a3.5 3.5 0 0 0-2.5-3.35M16.5 3.6a3.5 3.5 0 0 1 0 6.8" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 4h10a1 1 0 0 1 1 1v15l-6-3.5L6 20V5a1 1 0 0 1 1-1z" />
    </svg>
  );
}

function TicketIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 0 0 2-2V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1a2 2 0 0 0 2 2v6a2 2 0 0 0-2 2v1a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2V9z" />
      <path strokeLinecap="round" d="M10 8v8M14 8v8" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8.5" />
      <path strokeLinecap="round" d="M12 7.5V12l3 2" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
    </svg>
  );
}
