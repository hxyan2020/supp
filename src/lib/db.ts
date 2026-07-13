import { promises as fs } from "fs";
import path from "path";
import { mockIdeas, mockUser, mockFriends } from "@/data/mock-ideas";
import type { DbShape, IdeaRecord, ScrapedEventRecord, UserRecord } from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "store");
const DB_FILE = path.join(DATA_DIR, "db.json");

function now() {
  return new Date().toISOString();
}

function seedIdeas(): IdeaRecord[] {
  const ts = now();
  return mockIdeas.map((idea) => ({
    ...idea,
    country: idea.city === "Shanghai" ? "China" : idea.city === "Tokyo" ? "Japan" : "Hong Kong",
    published: true,
    createdAt: ts,
    updatedAt: ts,
  }));
}

function seedUsers(): UserRecord[] {
  const ts = now();
  const main: UserRecord = {
    id: "user-main",
    name: mockUser.name,
    nameZh: mockUser.nameZh,
    email: "guoqiang@supp.app",
    avatar: mockUser.avatar,
    locale: "zh",
    city: "Hong Kong",
    country: "China",
    experienced: mockUser.experienced,
    favorited: mockUser.favorited,
    claimed: mockUser.claimed,
    persona: mockUser.persona,
    personaZh: mockUser.personaZh,
    favoritedIds: mockUser.favoritedIds,
    experiencedIds: mockUser.experiencedIds,
    joinedIds: mockUser.joinedIds,
    status: "active",
    createdAt: ts,
    updatedAt: ts,
  };

  const friends: UserRecord[] = mockFriends.map((f) => ({
    id: f.id,
    name: f.name,
    nameZh: f.nameZh,
    email: `${f.id}@supp.app`,
    avatar: f.avatar,
    locale: "en",
    city: "Hong Kong",
    country: "China",
    experienced: Math.floor(f.overlap / 2),
    favorited: Math.floor(f.overlap / 3),
    claimed: 0,
    persona: "Explorer",
    personaZh: "探索者",
    favoritedIds: [],
    experiencedIds: [],
    joinedIds: [],
    status: "active",
    createdAt: ts,
    updatedAt: ts,
  }));

  return [main, ...friends];
}

function defaultDb(): DbShape {
  return {
    ideas: seedIdeas(),
    users: seedUsers(),
    scrapedEvents: [],
    scrapeRuns: [],
  };
}

async function ensureDb(): Promise<DbShape> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    return JSON.parse(raw) as DbShape;
  } catch {
    const db = defaultDb();
    await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), "utf8");
    return db;
  }
}

async function writeDb(db: DbShape) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), "utf8");
}

export async function readDb(): Promise<DbShape> {
  return ensureDb();
}

export async function listPublishedIdeas(): Promise<IdeaRecord[]> {
  const db = await readDb();
  return db.ideas.filter((i) => i.published);
}

export async function getIdeaFromDb(id: string): Promise<IdeaRecord | undefined> {
  const db = await readDb();
  return db.ideas.find((i) => i.id === id && i.published);
}

export async function listAllIdeas(): Promise<IdeaRecord[]> {
  const db = await readDb();
  return db.ideas;
}

export async function upsertIdea(idea: IdeaRecord): Promise<IdeaRecord> {
  const db = await readDb();
  const idx = db.ideas.findIndex((i) => i.id === idea.id);
  idea.updatedAt = now();
  if (idx >= 0) db.ideas[idx] = idea;
  else db.ideas.unshift({ ...idea, createdAt: idea.createdAt || now() });
  await writeDb(db);
  return idea;
}

export async function deleteIdea(id: string): Promise<boolean> {
  const db = await readDb();
  const before = db.ideas.length;
  db.ideas = db.ideas.filter((i) => i.id !== id);
  await writeDb(db);
  return db.ideas.length < before;
}

export async function listUsers(): Promise<UserRecord[]> {
  const db = await readDb();
  return db.users;
}

export async function upsertUser(user: UserRecord): Promise<UserRecord> {
  const db = await readDb();
  const idx = db.users.findIndex((u) => u.id === user.id);
  user.updatedAt = now();
  if (idx >= 0) db.users[idx] = user;
  else db.users.unshift({ ...user, createdAt: user.createdAt || now() });
  await writeDb(db);
  return user;
}

export async function deleteUser(id: string): Promise<boolean> {
  const db = await readDb();
  const before = db.users.length;
  db.users = db.users.filter((u) => u.id !== id);
  await writeDb(db);
  return db.users.length < before;
}

export async function listScrapedEvents(status?: ScrapedEventRecord["status"]) {
  const db = await readDb();
  if (!status) return db.scrapedEvents;
  return db.scrapedEvents.filter((e) => e.status === status);
}

export async function upsertScrapedEvents(events: ScrapedEventRecord[]) {
  const db = await readDb();
  for (const event of events) {
    const idx = db.scrapedEvents.findIndex(
      (e) => e.sourceUrl === event.sourceUrl || e.id === event.id,
    );
    if (idx >= 0) {
      db.scrapedEvents[idx] = { ...db.scrapedEvents[idx], ...event };
    } else {
      db.scrapedEvents.unshift(event);
    }
  }
  await writeDb(db);
  return events;
}

export async function updateScrapedEvent(
  id: string,
  patch: Partial<ScrapedEventRecord>,
): Promise<ScrapedEventRecord | null> {
  const db = await readDb();
  const idx = db.scrapedEvents.findIndex((e) => e.id === id);
  if (idx < 0) return null;
  db.scrapedEvents[idx] = { ...db.scrapedEvents[idx], ...patch };
  await writeDb(db);
  return db.scrapedEvents[idx];
}

export async function addScrapeRun(run: DbShape["scrapeRuns"][number]) {
  const db = await readDb();
  db.scrapeRuns.unshift(run);
  db.scrapeRuns = db.scrapeRuns.slice(0, 50);
  await writeDb(db);
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
