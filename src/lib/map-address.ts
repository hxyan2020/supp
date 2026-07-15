import type { Idea } from "@/data/mock-ideas";

export function hasMappableAddress(idea: Idea): boolean {
  const address = (idea.address || idea.addressZh || "").trim();
  return (
    Boolean(address) &&
    Number.isFinite(idea.lat) &&
    Number.isFinite(idea.lng) &&
    !(idea.lat === 0 && idea.lng === 0)
  );
}

/** Opens AMap (zh) or Google Maps navigation for the idea location. */
export function navigationUrl(idea: Idea, locale: string) {
  if (locale === "zh") {
    return `https://uri.amap.com/navigation?to=${idea.lng},${idea.lat},${encodeURIComponent(idea.addressZh || idea.address)}&mode=car&src=supp`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${idea.lat},${idea.lng}&travelmode=walking`;
}
