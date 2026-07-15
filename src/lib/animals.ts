import { promises as fs } from "fs";
import path from "path";

export type AnimalAvatar = {
  id: string;
  species: string;
  adjective: string;
  nicknameHint: string;
  family: string;
  palette: string[];
  path: string;
};

type AnimalsDb = {
  version: number;
  generatedAt: string;
  count: number;
  animals: AnimalAvatar[];
};

const DB_FILE = path.join(process.cwd(), "data", "avatars", "animals.json");

let cache: AnimalsDb | null = null;

export async function loadAnimalsDb(): Promise<AnimalsDb> {
  if (cache) return cache;
  const raw = await fs.readFile(DB_FILE, "utf8");
  cache = JSON.parse(raw) as AnimalsDb;
  return cache;
}

export async function listAnimals(): Promise<AnimalAvatar[]> {
  const db = await loadAnimalsDb();
  return db.animals;
}

export async function getAnimal(id: string): Promise<AnimalAvatar | undefined> {
  const db = await loadAnimalsDb();
  return db.animals.find((a) => a.id === id);
}

export async function randomAnimal(): Promise<AnimalAvatar> {
  const animals = await listAnimals();
  if (!animals.length) {
    throw new Error("Animal avatar collection is empty. Run: node scripts/generate-animal-avatars.mjs");
  }
  return animals[Math.floor(Math.random() * animals.length)]!;
}

const NICK_PREFIXES = [
  "Cosmic", "Sunny", "Pixel", "Neon", "Lucky", "Swift", "Cozy", "Wild",
  "Chill", "Zesty", "Mellow", "Spark", "Nova", "Velvet", "Pepper", "Mint",
];

const NICK_SUFFIXES = [
  "Fox", "Otter", "Panda", "Owl", "Byte", "Wave", "Bean", "Spark",
  "Puff", "Glow", "Drift", "Echo", "Nova", "Loop", "Dash", "Bloom",
];

export function randomNickname(seedAnimal?: AnimalAvatar): string {
  if (seedAnimal && Math.random() > 0.35) {
    return seedAnimal.nicknameHint;
  }
  const a = NICK_PREFIXES[Math.floor(Math.random() * NICK_PREFIXES.length)]!;
  const b = NICK_SUFFIXES[Math.floor(Math.random() * NICK_SUFFIXES.length)]!;
  return `${a} ${b}`;
}
