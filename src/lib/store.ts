import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { Idea } from "@/data/mock-ideas";
import { mockIdeas, mockFriends, mockUser } from "@/data/mock-ideas";

const DB_DIR = path.join(process.cwd(), "data", "db");

export type AdminUser = {
  id: string;
  name: string;
  nameZh: string;
  email: string;
  avatar: string;
  locale: string;
  experienced: number;
  favorited: number;
  claimed: number;
  persona: string;
  personaZh: string;
  favoritedIds: string[];
  experiencedIds: string[];
  joinedIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type ScrapedEventStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "published";

export type ScrapedEvent = {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  countryCode: string;
  countryName: string;
  title: string;
  summary: string;
  description: string;
  location: string;
  address: string;
  city: string;
  lat: number | null;
  lng: number | null;
  startDate: string;
  endDate: string;
  fee: number | null;
  currency: string;
  image: string;
  organizer: string;
  categories: string[];
  tags: string[];
  externalUrl: string;
  scrapedAt: string;
  status: ScrapedEventStatus;
  publishedIdeaId: string | null;
  adminNotes: string;
};

export type ScrapeRun = {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  countries: string[];
  sourcesTried: number;
  eventsFound: number;
  eventsNew: number;
  errors: string[];
};

async function ensureDb() {
  await mkdir(DB_DIR, { recursive: true });
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  await ensureDb();
  const filePath = path.join(DB_DIR, file);
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    await writeFile(filePath, JSON.stringify(fallback, null, 2), "utf8");
    return fallback;
  }
}

async function writeJson<T>(file: string, data: T) {
  await ensureDb();
  await writeFile(path.join(DB_DIR, file), JSON.stringify(data, null, 2), "utf8");
}

function seedUsers(): AdminUser[] {
  const now = new Date().toISOString();
  const users: AdminUser[] = [
    {
      id: "user-guoqiang",
      name: mockUser.name,
      nameZh: mockUser.nameZh,
      email: "guoqiang@supp.app",
      avatar: mockUser.avatar,
      locale: "zh",
      experienced: mockUser.experienced,
      favorited: mockUser.favorited,
      claimed: mockUser.claimed,
      persona: mockUser.persona,
      personaZh: mockUser.personaZh,
      favoritedIds: mockUser.favoritedIds,
      experiencedIds: mockUser.experiencedIds,
      joinedIds: mockUser.joinedIds,
      createdAt: now,
      updatedAt: now,
    },
  ];

  mockFriends.forEach((friend, i) => {
    users.push({
      id: friend.id,
      name: friend.name,
      nameZh: friend.nameZh,
      email: `friend${i + 1}@supp.app`,
      avatar: friend.avatar,
      locale: "en",
      experienced: 20 + i * 15,
      favorited: 10 + i * 8,
      claimed: i,
      persona: "Explorer",
      personaZh: "探索者",
      favoritedIds: [],
      experiencedIds: [],
      joinedIds: [],
      createdAt: now,
      updatedAt: now,
    });
  });

  return users;
}

export async function getIdeas(): Promise<Idea[]> {
  return readJson<Idea[]>("ideas.json", mockIdeas);
}

export async function saveIdeas(ideas: Idea[]) {
  await writeJson("ideas.json", ideas);
}

export async function getIdeaByIdFromStore(id: string): Promise<Idea | undefined> {
  const ideas = await getIdeas();
  return ideas.find((i) => i.id === id);
}

export async function getUsers(): Promise<AdminUser[]> {
  return readJson<AdminUser[]>("users.json", seedUsers());
}

export async function saveUsers(users: AdminUser[]) {
  await writeJson("users.json", users);
}

export async function getScrapedEvents(): Promise<ScrapedEvent[]> {
  return readJson<ScrapedEvent[]>("scraped-events.json", []);
}

export async function saveScrapedEvents(events: ScrapedEvent[]) {
  await writeJson("scraped-events.json", events);
}

export async function getScrapeRuns(): Promise<ScrapeRun[]> {
  return readJson<ScrapeRun[]>("scrape-runs.json", []);
}

export async function saveScrapeRuns(runs: ScrapeRun[]) {
  await writeJson("scrape-runs.json", runs);
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
