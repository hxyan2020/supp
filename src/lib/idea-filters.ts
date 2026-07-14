import type { Idea, SearchFilters } from "@/data/mock-ideas";

export function filterIdeas(ideas: Idea[], filters: SearchFilters) {
  const q = filters.query?.trim().toLowerCase() ?? "";
  return ideas.filter((idea) => {
    if (q) {
      const hay = [
        idea.title,
        idea.titleZh,
        idea.summary,
        idea.summaryZh,
        idea.location,
        idea.locationZh,
        ...idea.tags,
        ...idea.categories,
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filters.city && filters.city !== "any" && idea.city !== filters.city)
      return false;
    if (
      filters.weather &&
      filters.weather !== "any" &&
      idea.weather !== "any" &&
      idea.weather !== filters.weather
    )
      return false;
    if (filters.category && filters.category !== "any") {
      if (!idea.categories.includes(filters.category as Idea["categories"][number]))
        return false;
    }
    if (filters.fee && filters.fee !== "any") {
      if (filters.fee === "free" && idea.fee !== 0) return false;
      if (filters.fee === "under100" && !(idea.fee > 0 && idea.fee <= 100))
        return false;
      if (filters.fee === "over100" && !(idea.fee > 100)) return false;
    }
    if (filters.duration && filters.duration !== "any") {
      if (filters.duration === "short" && idea.durationMin > 30) return false;
      if (
        filters.duration === "medium" &&
        !(idea.durationMin > 30 && idea.durationMin <= 120)
      )
        return false;
      if (filters.duration === "long" && idea.durationMin <= 120) return false;
    }
    return true;
  });
}

export const SEARCH_CITIES = ["any", "Hong Kong", "Shanghai", "Tokyo"] as const;
export const SEARCH_WEATHERS = ["any", "sunny", "cloudy", "rainy"] as const;
export const SEARCH_FEES = ["any", "free", "under100", "over100"] as const;
export const SEARCH_DURATIONS = ["any", "short", "medium", "long"] as const;
export const SEARCH_CATEGORIES = [
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
