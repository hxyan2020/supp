import type { Idea, SearchFilters } from "@/data/mock-ideas";

const TRAVELLER_CATEGORIES = new Set([
  "culture",
  "taste",
  "outdoors",
  "social",
]);

const TRAVELLER_HINT =
  /sight|temple|market|food|local|tour|harbour|harbor|lane|crawl|ferry|breakfast|dawn|peak|photo|gallery|museum|street/i;

const GROUP_REQUIRED_HINT =
  /board\s*game|language exchange|disco|party|gathering|meetup|team|group/i;

export function isTravellerSuitable(idea: Idea): boolean {
  if (idea.categories.some((c) => TRAVELLER_CATEGORIES.has(c))) return true;
  const hay = `${idea.title} ${idea.titleZh} ${idea.tags.join(" ")} ${idea.summary}`;
  return TRAVELLER_HINT.test(hay);
}

export function isSoloSuitable(idea: Idea): boolean {
  const hay = `${idea.title} ${idea.tags.join(" ")} ${idea.summary}`;
  if (GROUP_REQUIRED_HINT.test(hay)) return false;

  // Small capped social/adrenaline sessions usually need others
  if (
    idea.categories.includes("social") &&
    idea.maxParticipants > 1 &&
    idea.maxParticipants <= 30
  ) {
    return false;
  }
  if (
    idea.categories.includes("adrenaline") &&
    idea.maxParticipants > 1 &&
    idea.maxParticipants <= 20
  ) {
    return false;
  }

  // High-engagement social experiences need people energy
  if (idea.engagement === "high" && idea.categories.includes("social")) {
    return false;
  }

  return true;
}

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
    if (filters.travellerMode && !isTravellerSuitable(idea)) return false;
    if (filters.introvertMode && !isSoloSuitable(idea)) return false;
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

/** Sensible starting values shown on the manual search form */
export const DEFAULT_SEARCH_FILTERS: SearchFilters = {
  city: "Hong Kong",
  weather: "any",
  fee: "any",
  duration: "any",
  category: "any",
  travellerMode: false,
  introvertMode: false,
};
