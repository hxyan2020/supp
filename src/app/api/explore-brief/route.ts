import { NextResponse } from "next/server";

export type ExploreBrief = {
  city: string | null;
  country: string | null;
  weatherLabel: string | null;
  locationLabel: string | null;
  historyEvent: string | null;
  historyYear: number | null;
};

function weatherCodeToKey(code: number): string {
  if (code === 0) return "clear";
  if (code <= 3) return "cloudy";
  if (code <= 67) return "rain";
  if (code <= 77) return "snow";
  if (code <= 82) return "showers";
  if (code <= 99) return "storm";
  return "cloudy";
}

async function fetchWeather(lat: number, lng: number) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lng));
  url.searchParams.set("current", "weather_code,temperature_2m");
  url.searchParams.set("timezone", "auto");

  const res = await fetch(url, { next: { revalidate: 600 } });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    current?: { weather_code?: number; temperature_2m?: number };
  };
  const code = data.current?.weather_code;
  const temp = data.current?.temperature_2m;
  if (code == null) return null;
  return {
    key: weatherCodeToKey(code),
    tempC: typeof temp === "number" ? Math.round(temp) : null,
  };
}

async function fetchPlace(lat: number, lng: number, locale: string) {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("zoom", "10");
  url.searchParams.set("addressdetails", "1");
  if (locale.startsWith("zh")) url.searchParams.set("accept-language", "zh");
  else url.searchParams.set("accept-language", locale);

  const res = await fetch(url, {
    headers: {
      "User-Agent": "SuppExplore/1.0 (https://github.com/hxyan2020/supp)",
    },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    address?: Record<string, string>;
  };
  const a = data.address ?? {};
  const city =
    a.city || a.town || a.municipality || a.village || a.state || a.county || null;
  const country = a.country || null;
  const district =
    a.city_district ||
    a.suburb ||
    a.neighbourhood ||
    a.quarter ||
    a.borough ||
    null;

  let locationLabel: string | null = null;
  if (city && country) locationLabel = `${city}, ${country}`;
  else if (city) locationLabel = city;
  else if (country) locationLabel = country;

  if (district && city && district !== city) {
    locationLabel = locationLabel
      ? `${city} · ${district}, ${country || ""}`.replace(/,\s*$/, "")
      : `${district}`;
  }

  return { city, country, district, locationLabel };
}

async function fetchOnThisDay(locale: string) {
  const now = new Date();
  const month = now.getUTCMonth() + 1;
  const day = now.getUTCDate();
  const wikiLang = locale.startsWith("zh")
    ? "zh"
    : locale.startsWith("ja")
      ? "ja"
      : locale.startsWith("ko")
        ? "ko"
        : locale.startsWith("fr")
          ? "fr"
          : locale.startsWith("es")
            ? "es"
            : locale.startsWith("ru")
              ? "ru"
              : locale.startsWith("ar")
                ? "ar"
                : "en";

  const url = `https://${wikiLang}.wikipedia.org/api/rest_v1/feed/onthisday/selected/${month}/${day}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 86_400 },
  });
  if (!res.ok) {
    // fallback English
    if (wikiLang !== "en") {
      const enRes = await fetch(
        `https://en.wikipedia.org/api/rest_v1/feed/onthisday/selected/${month}/${day}`,
        { headers: { Accept: "application/json" }, next: { revalidate: 86_400 } },
      );
      if (!enRes.ok) return null;
      return pickHistory(await enRes.json());
    }
    return null;
  }
  return pickHistory(await res.json());
}

function pickHistory(data: unknown): { text: string; year: number | null } | null {
  const payload = data as {
    selected?: { text?: string; year?: number; pages?: { description?: string }[] }[];
  };
  const items = payload.selected ?? [];
  if (!items.length) return null;
  // Prefer shorter, punchier events
  const ranked = [...items].sort(
    (a, b) => (a.text?.length ?? 999) - (b.text?.length ?? 999),
  );
  const pick = ranked[0];
  let text = (pick.text || "").trim();
  if (!text) return null;
  // Crisp: first sentence, max ~110 chars
  text = text.split(/(?<=[.!?。！？])\s/)[0] ?? text;
  if (text.length > 110) text = `${text.slice(0, 107).trim()}…`;
  return { text, year: pick.year ?? null };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get("locale") || "en";
  const latRaw = searchParams.get("lat");
  const lngRaw = searchParams.get("lng");
  const lat = latRaw != null ? Number(latRaw) : NaN;
  const lng = lngRaw != null ? Number(lngRaw) : NaN;
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

  const historyPromise = fetchOnThisDay(locale);
  const weatherPromise = hasCoords
    ? fetchWeather(lat, lng)
    : Promise.resolve(null);
  const locationPromise = hasCoords
    ? fetchPlace(lat, lng, locale)
    : Promise.resolve(null);

  const [history, weather, place] = await Promise.all([
    historyPromise,
    weatherPromise,
    locationPromise,
  ]);

  return NextResponse.json({
    city: place?.city ?? null,
    country: place?.country ?? null,
    locationLabel: place?.locationLabel ?? null,
    weatherKey: weather?.key ?? null,
    tempC: weather?.tempC ?? null,
    historyEvent: history?.text ?? null,
    historyYear: history?.year ?? null,
  });
}
