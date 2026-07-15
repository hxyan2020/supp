import { listPublishedIdeas, getIdeaFromDb } from "@/lib/db";
import {
  mockIdeas,
  getIdeaById as getMockIdeaById,
  localizedIdea,
  withSchedule,
  type Idea,
  type SearchFilters,
} from "@/data/mock-ideas";
import { filterIdeas } from "@/lib/idea-filters";
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
  return filterIdeas(ideas, filters);
}

export { localizedIdea };
