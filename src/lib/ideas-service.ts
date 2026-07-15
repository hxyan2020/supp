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
import { demoCreatorForSeed } from "@/lib/demo-creators";
import type { IdeaRecord } from "@/lib/types";

const MISSING_AVATARS = new Set([
  "/images/avatar-1.png",
  "/images/avatar-user.jpg",
  "/images/persona.png",
  "/avatars/default.svg",
  "",
]);

/** Attach a stable demo creator (from the 120 dummy-user pool) when missing. */
export function withDemoCreator(idea: Idea, seed = idea.id): Idea {
  const needsAvatar =
    !idea.organizerAvatar || MISSING_AVATARS.has(idea.organizerAvatar.trim());
  const needsCreator = !idea.creatorUserId;
  if (!needsAvatar && !needsCreator) return idea;
  const demo = demoCreatorForSeed(seed);
  return {
    ...idea,
    creatorUserId: idea.creatorUserId || demo.creatorUserId,
    organizer: needsAvatar ? demo.organizer : idea.organizer,
    organizerZh: needsAvatar ? demo.organizerZh : idea.organizerZh,
    organizerAvatar: needsAvatar ? demo.organizerAvatar : idea.organizerAvatar,
  };
}

function toIdea(record: IdeaRecord, index = 0): Idea {
  const { published, sourceUrl, sourcePlatform, country, createdAt, updatedAt, ...idea } =
    record;
  return withDemoCreator(withSchedule(idea as Idea, index), record.id || String(index));
}

export async function getPublishedIdeas(): Promise<Idea[]> {
  try {
    const rows = await listPublishedIdeas();
    if (rows.length) {
      // Merge published DB rows with mock catalog so favorited mock IDs still resolve on Me
      const fromDb = rows.map((row, i) => toIdea(row, i));
      const seen = new Set(fromDb.map((i) => i.id));
      const fromMock = mockIdeas
        .map((idea, i) => withDemoCreator(idea, idea.id || String(i)))
        .filter((i) => !seen.has(i.id));
      return [...fromDb, ...fromMock];
    }
  } catch {
    // fallback during build without writable data dir
  }
  return mockIdeas.map((idea, i) => withDemoCreator(idea, idea.id || String(i)));
}

export async function getIdeaById(id: string): Promise<Idea | undefined> {
  try {
    const row = await getIdeaFromDb(id);
    if (row) return toIdea(row);
  } catch {
    // ignore
  }
  const mock = getMockIdeaById(id);
  return mock ? withDemoCreator(mock, id) : undefined;
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
