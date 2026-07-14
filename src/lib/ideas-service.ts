import { listPublishedIdeas, getIdeaFromDb } from "@/lib/db";
import {
  mockIdeas,
  getIdeaById as getMockIdeaById,
  getTopRecommendations as getMockTop,
  searchIdeas as searchMock,
  localizedIdea,
  withSchedule,
  type Idea,
  type SearchFilters,
} from "@/data/mock-ideas";
import type { IdeaRecord } from "@/lib/types";

function toIdea(record: IdeaRecord, index = 0): Idea {
  const { published, sourceUrl, sourcePlatform, country, createdAt, updatedAt, ...idea } =
    record;
  return withSchedule(idea, index);
}

export async function getPublishedIdeas(): Promise<Idea[]> {
  try {
    const rows = await listPublishedIdeas();
    if (rows.length) return rows.map((row, i) => toIdea(row, i));
  } catch {
    // fallback during build without writable data dir
  }
  return mockIdeas;
}

export async function getIdeaById(id: string): Promise<Idea | undefined> {
  try {
    const row = await getIdeaFromDb(id);
    if (row) return toIdea(row);
  } catch {
    // ignore
  }
  return getMockIdeaById(id);
}

export async function getTopRecommendations(limit = 10): Promise<Idea[]> {
  const ideas = await getPublishedIdeas();
  return [...ideas].sort((a, b) => b.relevance - a.relevance).slice(0, limit);
}

export async function searchIdeas(filters: SearchFilters = {}): Promise<Idea[]> {
  const ideas = await getPublishedIdeas();
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
    if (filters.city && filters.city !== "any" && idea.city !== filters.city) return false;
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
      if (filters.fee === "under100" && !(idea.fee > 0 && idea.fee <= 100)) return false;
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

export { localizedIdea };
