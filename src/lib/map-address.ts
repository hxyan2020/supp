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
