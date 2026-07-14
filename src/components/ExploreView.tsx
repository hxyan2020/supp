"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { localizedIdea, type Idea } from "@/data/mock-ideas";

type BriefPayload = {
  locationLabel: string | null;
  weatherKey: string | null;
  tempC: number | null;
  historyEvent: string | null;
  historyYear: number | null;
};

type HighlightPart = { text: string; accent?: boolean };

export function ExploreView({ ideas }: { ideas: Idea[] }) {
  const t = useTranslations("explore");
  const locale = useLocale();
  const [now, setNow] = useState(() => new Date());
  const [brief, setBrief] = useState<BriefPayload | null>(null);
  const [experienced, setExperienced] = useState<Record<string, boolean>>({});
  const [favorited, setFavorited] = useState<Record<string, boolean>>({});

  const top10 = useMemo(
    () => [...ideas].sort((a, b) => b.relevance - a.relevance).slice(0, 10),
    [ideas],
  );

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadBrief(coords?: { lat: number; lng: number }) {
      const params = new URLSearchParams({ locale });
      if (coords) {
        params.set("lat", String(coords.lat));
        params.set("lng", String(coords.lng));
      }
      try {
        const res = await fetch(`/api/explore-brief?${params}`);
        if (!res.ok) return;
        const data = (await res.json()) as BriefPayload;
        if (!cancelled) setBrief(data);
      } catch {
        // keep partial UI without brief extras
      }
    }

    // Always load history; attach weather/location if permitted
    void loadBrief();

    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void loadBrief({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        // location denied — brief already loaded without it
      },
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 300_000 },
    );

    return () => {
      cancelled = true;
    };
  }, [locale]);

  const dateLabel = now.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
  const timeLabel = now.toLocaleTimeString(locale, {
    hour: "numeric",
    minute: "2-digit",
  });

  const weatherLabel = brief?.weatherKey
    ? [
        t(`liveWeather.${brief.weatherKey}`),
        brief.tempC != null ? `${brief.tempC}°C` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : null;

  const briefParts = buildBriefParts({
    greeting: greetingForHour(now.getHours(), t),
    dateLabel,
    timeLabel,
    locationLabel: brief?.locationLabel ?? null,
    weatherLabel,
    historyEvent: brief?.historyEvent ?? null,
    historyYear: brief?.historyYear ?? null,
    t,
  });

  return (
    <div className="relative min-h-[calc(100dvh-7.5rem)] overflow-hidden bg-supp-black text-white">
      <Image
        src="/images/hero-mountain.jpg"
        alt=""
        fill
        priority
        className="object-cover opacity-55"
        sizes="500px"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/85" />

      <div className="relative z-10 px-4 pb-10 pt-5 animate-fade-up">
        <h1 className="text-xl font-semibold tracking-wide">{t("smartTitle")}</h1>

        <div className="mt-3 rounded-2xl bg-black/45 px-3.5 py-3 text-[13px] leading-relaxed text-white/90 backdrop-blur-md">
          {briefParts.map((part, i) =>
            part.accent ? (
              <span key={i} className="font-semibold text-supp-red">
                {part.text}
              </span>
            ) : (
              <span key={i}>{part.text}</span>
            ),
          )}
        </div>

        <ul className="mt-5 space-y-5 overflow-x-hidden px-1 pb-2">
          {top10.map((idea, index) => {
            const L = localizedIdea(idea, locale);
            const done = !!experienced[idea.id];
            const saved = !!favorited[idea.id];
            const experiencedCount =
              idea.experiencedCount + (done ? 1 : 0);
            const favoritedCount = idea.favoritedCount + (saved ? 1 : 0);
            const scatter = scatterStyle(idea.id, index);

            return (
              <li
                key={idea.id}
                className="origin-center transition-transform duration-300 hover:z-10 hover:rotate-0 hover:scale-[1.02]"
                style={scatter}
              >
                <div className="relative min-h-[7.5rem] overflow-hidden rounded-2xl border border-white/10 shadow-[0_10px_28px_rgba(0,0,0,0.45)]">
                  <Image
                    src={idea.image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="500px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/65 to-black/45" />
                  <div className="relative z-10 p-4">
                    <Link href={`/ideas/${idea.id}`} className="block">
                      <p className="text-[15px] font-semibold leading-snug text-white">
                        {L.title}
                      </p>
                    </Link>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <p className="text-[11px] text-white/75">
                        {t("experiencedCount", { count: experiencedCount })}
                        <span className="mx-1.5 text-white/35">|</span>
                        {t("favoritedCount", { count: favoritedCount })}
                      </p>
                      <div className="flex shrink-0 items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setExperienced((s) => ({
                              ...s,
                              [idea.id]: !s[idea.id],
                            }))
                          }
                          className={`flex items-center gap-1 text-[11px] ${
                            done ? "text-supp-red" : "text-white/70"
                          }`}
                        >
                          <CheckIcon filled={done} />
                          {t("markExperienced")}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFavorited((s) => ({
                              ...s,
                              [idea.id]: !s[idea.id],
                            }))
                          }
                          className={`flex items-center gap-1 text-[11px] ${
                            saved ? "text-supp-red" : "text-white/70"
                          }`}
                        >
                          <HeartIcon filled={saved} />
                          {t("markFavorite")}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 space-y-4 text-center">
          <Link
            href="/explore/search"
            className="mx-auto flex w-[78%] items-center justify-center rounded-full bg-white py-3 text-sm font-semibold text-supp-ink shadow-lg transition hover:bg-white/95"
          >
            {t("manualSearch")}
          </Link>

          <p className="mx-auto max-w-sm text-[12px] leading-relaxed text-white/70">
            {t("createHint")}
          </p>

          <Link
            href="/explore/search"
            className="mx-auto flex w-[88%] items-center justify-center rounded-full bg-supp-red py-3.5 text-sm font-semibold text-white shadow-lg shadow-red-900/40 transition hover:bg-supp-red-dark"
          >
            {t("createIdea")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function scatterStyle(id: string, index: number): React.CSSProperties {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  hash = (hash + index * 97) >>> 0;
  const tilt = ((hash % 13) - 6) * 0.9; // about -5.4° … 5.4°
  const shiftX = ((hash >> 4) % 17) - 8; // about -8 … 8 px
  const shiftY = ((hash >> 8) % 9) - 4;
  return {
    transform: `rotate(${tilt.toFixed(2)}deg) translate(${shiftX}px, ${shiftY}px)`,
  };
}

function greetingForHour(hour: number, t: (key: string) => string) {
  if (hour < 5) return t("greetNight");
  if (hour < 12) return t("greetMorning");
  if (hour < 18) return t("greetAfternoon");
  return t("greetEvening");
}

function buildBriefParts({
  greeting,
  dateLabel,
  timeLabel,
  locationLabel,
  weatherLabel,
  historyEvent,
  historyYear,
  t,
}: {
  greeting: string;
  dateLabel: string;
  timeLabel: string;
  locationLabel: string | null;
  weatherLabel: string | null;
  historyEvent: string | null;
  historyYear: number | null;
  t: (key: string) => string;
}): HighlightPart[] {
  const parts: HighlightPart[] = [
    { text: `${greeting} ` },
    { text: t("briefTodayIs") },
    { text: " " },
    { text: dateLabel, accent: true },
    { text: t("briefComma") },
    { text: timeLabel, accent: true },
    { text: t("briefPeriod") },
  ];

  if (historyEvent) {
    parts.push({ text: " " });
    parts.push({ text: t("briefOnThisDay") });
    parts.push({ text: " " });
    if (historyYear != null) {
      parts.push({ text: String(historyYear), accent: true });
      parts.push({ text: ": " });
    }
    parts.push({ text: historyEvent, accent: true });
    parts.push({ text: t("briefPeriod") });
  }

  if (locationLabel) {
    parts.push({ text: " " });
    parts.push({ text: t("briefYouAreIn") });
    parts.push({ text: " " });
    parts.push({ text: locationLabel, accent: true });
    if (weatherLabel) {
      parts.push({ text: t("briefWeatherSep") });
      parts.push({ text: weatherLabel, accent: true });
    }
    parts.push({ text: t("briefPeriod") });
  } else if (weatherLabel) {
    parts.push({ text: " " });
    parts.push({ text: t("briefWeatherOnly") });
    parts.push({ text: " " });
    parts.push({ text: weatherLabel, accent: true });
    parts.push({ text: t("briefPeriod") });
  }

  parts.push({ text: " " });
  parts.push({ text: t("briefClose") });

  return parts;
}

function CheckIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8.5" fill={filled ? "currentColor" : "none"} />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke={filled ? "#141414" : "currentColor"}
        d="m8.5 12.2 2.3 2.3 4.7-4.8"
      />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 20s-7-4.4-7-9.2A3.8 3.8 0 0 1 12 7.5a3.8 3.8 0 0 1 7 3.3C19 15.6 12 20 12 20z"
      />
    </svg>
  );
}
