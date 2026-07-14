const EARTH_RADIUS_KM = 6371;

export type LatLng = { lat: number; lng: number };

/** Great-circle distance in kilometers. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatDistanceKm(km: number): string {
  if (!Number.isFinite(km)) return "—";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

export const MAP_UPCOMING_HOURS = 14;
export const MAP_DAY_WINDOW_HOURS = 24;

export function isIdeaInHoursWindow(
  startsAtIso: string,
  endsAtIso: string,
  hours: number,
  nowMs = Date.now(),
): boolean {
  const start = Date.parse(startsAtIso);
  const end = Date.parse(endsAtIso);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
  const windowEnd = nowMs + hours * 60 * 60 * 1000;
  return end > nowMs && start < windowEnd;
}

export function isIdeaOnMap(
  startsAtIso: string,
  endsAtIso: string,
  nowMs = Date.now(),
): boolean {
  return isIdeaInHoursWindow(
    startsAtIso,
    endsAtIso,
    MAP_UPCOMING_HOURS,
    nowMs,
  );
}

export function formatTimeRange(
  startsAtIso: string,
  endsAtIso: string,
  locale: string,
): string {
  const start = new Date(startsAtIso);
  const end = new Date(endsAtIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "—";
  const opts: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
  };
  const sameDay = start.toDateString() === end.toDateString();
  if (sameDay) {
    return `${start.toLocaleTimeString(locale, opts)} – ${end.toLocaleTimeString(locale, opts)}`;
  }
  const dayOpts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  };
  return `${start.toLocaleString(locale, dayOpts)} – ${end.toLocaleString(locale, dayOpts)}`;
}
