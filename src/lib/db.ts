import { promises as fs } from "fs";
import path from "path";
import { mockIdeas, mockUser, mockFriends } from "@/data/mock-ideas";
import type { DbShape, IdeaRecord, ScrapedEventRecord, UserRecord, CommentRecord } from "./types";

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
    creationStatus: "published" as const,
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
    experiencedAt: Object.fromEntries(
      mockUser.experiencedIds.map((id, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (i % 3));
        d.setDate(10 + i);
        return [id, d.toISOString()];
      }),
    ),
    joinedIds: mockUser.joinedIds,
    followingIds: ["f1", "f2"],
    followerIds: ["f1", "f3"],
    status: "active",
    createdAt: ts,
    updatedAt: ts,
  };

  const friendSeeds: {
    id: string;
    favoritedIds: string[];
    experiencedIds: string[];
    followingIds: string[];
  }[] = [
    {
      id: "f1",
      favoritedIds: ["sunrise-hike", "pottery-bowl", "night-market-crawl", "rainy-bookstore"],
      experiencedIds: ["sunrise-hike", "rooftop-yoga"],
      followingIds: ["user-main", "f2"],
    },
    {
      id: "f2",
      favoritedIds: ["pottery-bowl", "urban-sketch", "midnight-photo", "language-boardgame"],
      experiencedIds: ["pottery-bowl", "silent-disco-ferry"],
      followingIds: ["user-main"],
    },
    {
      id: "f3",
      favoritedIds: ["night-market-crawl", "shanghai-lane-breakfast", "sunrise-hike"],
      experiencedIds: ["night-market-crawl"],
      followingIds: ["user-main", "f1"],
    },
  ];

  const friends: UserRecord[] = mockFriends.map((f) => {
    const seed = friendSeeds.find((s) => s.id === f.id)!;
    return {
      id: f.id,
      name: f.name,
      nameZh: f.nameZh,
      email: `${f.id}@supp.app`,
      avatar: f.avatar,
      locale: "en",
      city: "Hong Kong",
      country: "China",
      experienced: seed.experiencedIds.length,
      favorited: seed.favoritedIds.length,
      claimed: 0,
      persona: "Explorer",
      personaZh: "探索者",
      favoritedIds: seed.favoritedIds,
      experiencedIds: seed.experiencedIds,
      experiencedAt: Object.fromEntries(
        seed.experiencedIds.map((id, i) => {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          return [id, d.toISOString()];
        }),
      ),
      joinedIds: [],
      followingIds: seed.followingIds,
      followerIds: [],
      status: "active" as const,
      createdAt: ts,
      updatedAt: ts,
    };
  });

  // Derive followerIds from following graph
  const all = [main, ...friends];
  for (const u of all) {
    u.followerIds = all
      .filter((o) => (o.followingIds ?? []).includes(u.id))
      .map((o) => o.id);
  }

  return all;
}

function defaultDb(): DbShape {
  return {
    ideas: seedIdeas(),
    users: seedUsers(),
    comments: [],
    scrapedEvents: [],
    scrapeRuns: [],
  };
}

function migrateDb(db: DbShape): DbShape {
  if (!Array.isArray(db.comments)) db.comments = [];
  if (!Array.isArray(db.ideas)) db.ideas = [];
  if (!Array.isArray(db.users)) db.users = [];
  if (!Array.isArray(db.scrapedEvents)) db.scrapedEvents = [];
  if (!Array.isArray(db.scrapeRuns)) db.scrapeRuns = [];
  return db;
}

async function ensureDb(): Promise<DbShape> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    return migrateDb(JSON.parse(raw) as DbShape);
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

export async function getIdeaRecordById(
  id: string,
): Promise<IdeaRecord | undefined> {
  const db = await readDb();
  return db.ideas.find((i) => i.id === id);
}

export async function listIdeasByCreator(
  userId: string,
): Promise<IdeaRecord[]> {
  const db = await readDb();
  return db.ideas.filter((i) => i.creatorUserId === userId);
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

export async function getUserById(id: string): Promise<UserRecord | undefined> {
  const db = await readDb();
  return db.users.find((u) => u.id === id);
}

export async function getUserByEmail(
  email: string,
): Promise<UserRecord | undefined> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return undefined;
  const db = await readDb();
  return db.users.find((u) => u.email?.toLowerCase() === normalized);
}

export async function getUserByUsername(
  username: string,
): Promise<UserRecord | undefined> {
  const normalized = username.trim().toLowerCase();
  if (!normalized) return undefined;
  const db = await readDb();
  return db.users.find((u) => u.username?.toLowerCase() === normalized);
}

export async function getUserByGoogleId(
  googleId: string,
): Promise<UserRecord | undefined> {
  if (!googleId) return undefined;
  const db = await readDb();
  return db.users.find((u) => u.googleId === googleId);
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

export async function listPublishedComments(
  ideaId: string,
): Promise<CommentRecord[]> {
  const db = await readDb();
  return db.comments.filter(
    (c) => c.ideaId === ideaId && c.status === "published",
  );
}

export async function addComment(
  comment: CommentRecord,
): Promise<CommentRecord> {
  const db = await readDb();
  db.comments.unshift(comment);
  // Keep store bounded
  db.comments = db.comments.slice(0, 5000);
  await writeDb(db);
  return comment;
}
