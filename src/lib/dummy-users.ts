import { promises as fs } from "fs";
import path from "path";
import { listAnimals } from "@/lib/animals";
import { listUsers, readDb, upsertUser } from "@/lib/db";
import {
  deterministicHashPassword,
  dummyPasswordFor,
  dummyUsernameFor,
} from "@/lib/password";
import type { UserRecord } from "@/lib/types";

const CREDENTIALS_FILE = path.join(
  process.cwd(),
  "data",
  "store",
  "dummy-credentials.json",
);

const CITIES = [
  { city: "Hong Kong", country: "China", locale: "zh" },
  { city: "Shanghai", country: "China", locale: "zh" },
  { city: "Beijing", country: "China", locale: "zh" },
  { city: "Tokyo", country: "Japan", locale: "ja" },
  { city: "Osaka", country: "Japan", locale: "ja" },
  { city: "Seoul", country: "South Korea", locale: "ko" },
  { city: "Singapore", country: "Singapore", locale: "en" },
  { city: "Taipei", country: "Taiwan", locale: "zh" },
  { city: "Bangkok", country: "Thailand", locale: "en" },
  { city: "London", country: "United Kingdom", locale: "en" },
];

type RoleSeed = {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  avatar: string;
};

async function loadRoles(): Promise<RoleSeed[]> {
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "data", "personas", "roles.json"),
      "utf8",
    );
    const data = JSON.parse(raw) as { roles: RoleSeed[] };
    return data.roles || [];
  } catch {
    return [
      {
        id: "explorer",
        name: "Explorer",
        nameZh: "探索者",
        description: "You seek new terrain.",
        descriptionZh: "你热爱探索新地形。",
        avatar: "/personas/roles/explorer.png",
      },
    ];
  }
}

export type DummyCredential = {
  index: number;
  id: string;
  username: string;
  password: string;
  email: string;
  nickname: string;
};

export type DummySeedResult = {
  created: number;
  skipped: number;
  total: number;
  credentials: DummyCredential[];
};

/** Build (or refresh) 120 dummy login profiles. Idempotent by username. */
export async function seedDummyUsers(count = 120): Promise<DummySeedResult> {
  const animals = await listAnimals();
  const roles = await loadRoles();
  const existing = await listUsers();
  const byUsername = new Map(
    existing
      .filter((u) => u.username)
      .map((u) => [u.username!.toLowerCase(), u] as const),
  );

  const credentials: DummyCredential[] = [];
  let created = 0;
  let skipped = 0;
  const ts = new Date().toISOString();

  for (let i = 1; i <= count; i++) {
    const username = dummyUsernameFor(i);
    const password = dummyPasswordFor(i);
    const email = `${username}@supp.demo`;
    const place = CITIES[(i - 1) % CITIES.length]!;
    const animal = animals.length
      ? animals[(i - 1) % animals.length]!
      : {
          id: "fallback",
          path: "/images/avatar-user.jpg",
          nicknameHint: `Demo ${i}`,
        };
    const role = roles[(i - 1) % roles.length]!;
    const nickname = animal.nicknameHint || `Demo ${String(i).padStart(3, "0")}`;

    const prior = byUsername.get(username.toLowerCase());
    if (prior) {
      // Refresh password hash + login fields so demos stay usable
      await upsertUser({
        ...prior,
        username,
        passwordHash: deterministicHashPassword(password, username),
        email: prior.email || email,
        isGuest: false,
        authProvider: prior.authProvider === "google" ? prior.authProvider : "password",
        status: prior.status || "active",
        updatedAt: ts,
      });
      credentials.push({
        index: i,
        id: prior.id,
        username,
        password,
        email: prior.email || email,
        nickname: prior.name || nickname,
      });
      skipped += 1;
      continue;
    }

    const user: UserRecord = {
      id: username,
      username,
      passwordHash: deterministicHashPassword(password, username),
      name: nickname,
      nameZh: nickname,
      email,
      avatar: animal.path,
      avatarAnimalId: "id" in animal ? animal.id : undefined,
      locale: place.locale,
      city: place.city,
      country: place.country,
      experienced: (i * 3) % 17,
      favorited: (i * 5) % 23,
      claimed: i % 4,
      percentile: 40 + (i % 55),
      persona: role.name,
      personaZh: role.nameZh,
      personaDesc: role.description,
      personaDescZh: role.descriptionZh,
      personaRoleId: role.id,
      personaAvatar: role.avatar,
      favoritedIds: [],
      experiencedIds: [],
      experiencedAt: {},
      joinedIds: [],
      followingIds: [],
      followerIds: [],
      status: "active",
      isGuest: false,
      authProvider: "password",
      createdAt: ts,
      updatedAt: ts,
    };

    const saved = await upsertUser(user);
    credentials.push({
      index: i,
      id: saved.id,
      username,
      password,
      email,
      nickname,
    });
    created += 1;
  }

  await fs.mkdir(path.dirname(CREDENTIALS_FILE), { recursive: true });
  await fs.writeFile(
    CREDENTIALS_FILE,
    JSON.stringify(
      {
        generatedAt: ts,
        count: credentials.length,
        note: "Dummy profiles for testing. Username = demo001…demo120, password = Demo001!…Demo120!",
        credentials,
      },
      null,
      2,
    ),
    "utf8",
  );

  return {
    created,
    skipped,
    total: credentials.length,
    credentials,
  };
}

export async function readDummyCredentials(): Promise<DummyCredential[]> {
  try {
    const raw = await fs.readFile(CREDENTIALS_FILE, "utf8");
    const data = JSON.parse(raw) as { credentials?: DummyCredential[] };
    return data.credentials || [];
  } catch {
    return [];
  }
}

export function sanitizeUserForAdmin(user: UserRecord) {
  const { passwordHash, ...rest } = user;
  return {
    ...rest,
    hasPassword: Boolean(passwordHash),
  };
}

export async function countDummyUsers() {
  const users = await listUsers();
  return users.filter((u) => u.username?.startsWith("demo")).length;
}

export async function listUsersSansSecrets() {
  const db = await readDb();
  return db.users.map(sanitizeUserForAdmin);
}
