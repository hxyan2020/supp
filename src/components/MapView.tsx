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
  const [locating, setLocating] = useState(true);

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

  async function fallbackIpLocation() {
    try {
      const res = await fetch("/api/geo", { cache: "no-store" });
      if (!res.ok) return false;
      const data = (await res.json()) as { lat?: number; lng?: number };
      if (!Number.isFinite(data.lat) || !Number.isFinite(data.lng)) return false;
      setUserLocation({ lat: data.lat as number, lng: data.lng as number });
      setLocateError(false);
      return true;
    } catch {
      return false;
    }
  }

  function applyPosition(pos: GeolocationPosition) {
    setUserLocation({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
    });
    setLocateError(false);
    setLocating(false);
  }

  useEffect(() => {
    let watchId: number | null = null;
    let cancelled = false;

    async function start() {
      setLocating(true);
      if (!navigator.geolocation) {
        const ok = await fallbackIpLocation();
        if (!cancelled) {
          setLocateError(!ok);
          setLocating(false);
        }
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (cancelled) return;
          applyPosition(pos);
        },
        () => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              if (cancelled) return;
              applyPosition(pos);
            },
            () => {
              void fallbackIpLocation().then((ok) => {
                if (cancelled) return;
                setLocateError(!ok);
                setLocating(false);
              });
            },
            {
              enableHighAccuracy: false,
              timeout: 12_000,
              maximumAge: 120_000,
            },
          );
        },
        { enableHighAccuracy: true, timeout: 18_000, maximumAge: 30_000 },
      );

      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          if (cancelled) return;
          applyPosition(pos);
        },
        () => {
          /* keep last good fix */
        },
        { enableHighAccuracy: true, maximumAge: 15_000, timeout: 20_000 },
      );
    }

    void start();
    return () => {
      cancelled = true;
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
    };
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
    setLocating(true);
    if (!navigator.geolocation) {
      void fallbackIpLocation().then((ok) => {
        setLocateError(!ok);
        setLocating(false);
      });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => applyPosition(pos),
      () => {
        void fallbackIpLocation().then((ok) => {
          setLocateError(!ok);
          setLocating(false);
        });
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
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
      : locating
        ? t("distanceLocating")
        : locateError
          ? t("distanceUnknown")
          : t("distanceLocating");

  const L = selected ? localizedIdea(selected, locale) : null;

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

      {selected && L && (
        <div className="absolute inset-x-3 bottom-24 z-20 animate-fade-up rounded-2xl border border-white/10 bg-[#141414]/75 p-2.5 text-white shadow-xl backdrop-blur-sm">
          <button
            type="button"
            onClick={() => {
              setCardDismissed(true);
              setSelected(null);
            }}
            className="absolute end-1.5 top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/45 text-xs leading-none text-white/80 transition hover:bg-black/60 hover:text-white"
            aria-label={t("closeCard")}
          >
            ×
          </button>

          <Link href={`/ideas/${selected.id}`} className="flex gap-2.5 pe-7">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
              <Image
                src={selected.image}
                alt=""
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold leading-tight">
                {L.title}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-white/50">
                {L.address}
              </p>
            </div>
          </Link>

          <div className="mt-2 flex items-end gap-2 border-t border-white/10 pt-2">
            <div className="grid min-w-0 flex-1 grid-cols-3 gap-x-2 gap-y-1.5 text-[10px] text-white/80">
              <MetaCompact
                icon={<UsersIcon />}
                label={t("experienced")}
                value={String(selected.experiencedCount)}
              />
              <MetaCompact
                icon={<BookmarkIcon />}
                label={t("collected")}
                value={String(selected.favoritedCount)}
              />
              <MetaCompact
                icon={<TicketIcon />}
                label={t("ticket")}
                value={formatFee(selected.fee, currency, tIdea("free"))}
              />
              <MetaCompact
                icon={<PinIcon />}
                label={t("distance")}
                value={distanceLabel}
              />
              <MetaCompact
                icon={<BoltIcon />}
                label={t("engagement")}
                value={t(`engagementLevels.${engagementForIdea(selected)}`)}
              />
              <MetaCompact
                icon={<ClockIcon />}
                label={t("time")}
                value={`${formatEventDate(selected.startsAt, locale)} · ${formatTimeRange(selected.startsAt, selected.endsAt, locale)}`}
              />
            </div>

            <a
              href={navigationUrl(selected, locale)}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 self-end rounded-xl bg-supp-red px-3.5 py-2.5 text-xs font-semibold text-white shadow-md shadow-red-900/30 transition hover:bg-supp-red-dark"
            >
              {t("navigate")}
            </a>
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

function MetaCompact({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-white/40">
        <span className="text-supp-red">{icon}</span>
        {label}
      </p>
      <p className="truncate font-medium leading-tight text-white/90">{value}</p>
    </div>
  );
}

function UsersIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="3.5" />
      <path strokeLinecap="round" d="M22 21v-2a3.5 3.5 0 0 0-2.5-3.35M16.5 3.6a3.5 3.5 0 0 1 0 6.8" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 4h10a1 1 0 0 1 1 1v15l-6-3.5L6 20V5a1 1 0 0 1 1-1z" />
    </svg>
  );
}

function TicketIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 0 0 2-2V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1a2 2 0 0 0 2 2v6a2 2 0 0 0-2 2v1a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2V9z" />
      <path strokeLinecap="round" d="M10 8v8M14 8v8" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8.5" />
      <path strokeLinecap="round" d="M12 7.5V12l3 2" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
    </svg>
  );
}
