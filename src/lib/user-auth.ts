import { cookies } from "next/headers";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { getAnimal, randomAnimal, randomNickname } from "@/lib/animals";
import { resolveAvatar } from "@/lib/avatar";
import {
  getUserByEmail,
  getUserByGoogleId,
  getUserById,
  newId,
  upsertUser,
} from "@/lib/db";
import type { UserRecord } from "@/lib/types";

const COOKIE = "supp_user_session";
const MAX_AGE = 60 * 60 * 24 * 90; // 90 days
const OTP_PATH = path.join(process.cwd(), "data", "store", "email-otps.json");

function secret() {
  return (
    process.env.AUTH_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "supp-user-dev-secret"
  );
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

export function createUserToken(userId: string) {
  const exp = Date.now() + MAX_AGE * 1000;
  const payload = `${userId}:${exp}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyUserToken(token?: string | null): string | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  const idx = payload.lastIndexOf(":");
  if (idx < 0) return null;
  const userId = payload.slice(0, idx);
  const exp = Number(payload.slice(idx + 1));
  if (!userId || !Number.isFinite(exp) || exp <= Date.now()) return null;
  return userId;
}

export async function setUserSession(userId: string) {
  const jar = await cookies();
  jar.set(COOKIE, createUserToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearUserSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSessionUserId(): Promise<string | null> {
  const jar = await cookies();
  return verifyUserToken(jar.get(COOKIE)?.value);
}

function blankStats(
  partial: Partial<UserRecord> & Pick<UserRecord, "id" | "name" | "avatar">,
): UserRecord {
  const ts = new Date().toISOString();
  return {
    id: partial.id,
    name: partial.name,
    nameZh: partial.nameZh ?? partial.name,
    email: partial.email ?? "",
    avatar: partial.avatar,
    avatarAnimalId: partial.avatarAnimalId,
    locale: partial.locale ?? "en",
    city: partial.city ?? "",
    country: partial.country ?? "",
    experienced: partial.experienced ?? 0,
    favorited: partial.favorited ?? 0,
    claimed: partial.claimed ?? 0,
    percentile: partial.percentile ?? 0,
    persona: partial.persona ?? "",
    personaZh: partial.personaZh ?? "",
    personaDesc: partial.personaDesc ?? "",
    personaDescZh: partial.personaDescZh ?? "",
    personaRoleId: partial.personaRoleId,
    personaAvatar: partial.personaAvatar,
    favoritedIds: partial.favoritedIds ?? [],
    experiencedIds: partial.experiencedIds ?? [],
    experiencedAt: partial.experiencedAt ?? {},
    likedCommentIds: partial.likedCommentIds ?? [],
    likedCommentAt: partial.likedCommentAt ?? {},
    joinedIds: partial.joinedIds ?? [],
    followingIds: partial.followingIds ?? [],
    followerIds: partial.followerIds ?? [],
    status: partial.status ?? "active",
    isGuest: partial.isGuest ?? false,
    authProvider: partial.authProvider ?? "guest",
    googleId: partial.googleId,
    createdAt: partial.createdAt ?? ts,
    updatedAt: partial.updatedAt ?? ts,
  };
}

export async function createGuestUser(): Promise<UserRecord> {
  const animal = await randomAnimal();
  const nickname = randomNickname(animal);
  const user = blankStats({
    id: newId("user"),
    name: nickname,
    nameZh: nickname,
    avatar: animal.path,
    avatarAnimalId: animal.id,
    isGuest: true,
    authProvider: "guest",
  });
  const saved = await upsertUser(user);
  const { bootstrapGuestSocial } = await import("@/lib/social");
  return bootstrapGuestSocial(saved);
}

export async function ensureSessionUser(): Promise<UserRecord> {
  const existingId = await getSessionUserId();
  if (existingId) {
    const found = await getUserById(existingId);
    if (found && found.status === "active") {
      const hasSignals =
        (found.favoritedIds?.length ?? 0) +
          (found.experiencedIds?.length ?? 0) >
        0;
      if (hasSignals) {
        const { recalculateUserPersona } = await import("@/lib/persona-service");
        return recalculateUserPersona(found);
      }
      return found;
    }
  }
  const guest = await createGuestUser();
  await setUserSession(guest.id);
  return guest;
}

export function publicUser(user: UserRecord) {
  const unlocked = Boolean(
    user.personaRoleId &&
      ((user.favoritedIds?.length ?? 0) > 0 ||
        (user.experiencedIds?.length ?? 0) > 0),
  );
  return {
    id: user.id,
    nickname: user.name,
    avatar: resolveAvatar(user.avatar),
    avatarAnimalId: user.avatarAnimalId ?? null,
    email: user.email || null,
    isGuest: Boolean(user.isGuest),
    authProvider: user.authProvider ?? (user.isGuest ? "guest" : "email"),
    experienced: user.experienced,
    favorited: user.favorited,
    claimed: user.claimed,
    percentile: user.percentile ?? 0,
    personaUnlocked: unlocked,
    personaRoleId: user.personaRoleId ?? null,
    personaAvatar: user.personaAvatar ?? null,
    persona: user.persona,
    personaZh: user.personaZh,
    personaDesc: user.personaDesc ?? "",
    personaDescZh: user.personaDescZh ?? "",
    favoritedIds: user.favoritedIds,
    experiencedIds: user.experiencedIds,
    experiencedAt: user.experiencedAt ?? {},
    joinedIds: user.joinedIds,
    followingIds: user.followingIds ?? [],
    followerIds: user.followerIds ?? [],
  };
}

export type UpdateProfileInput = {
  nickname?: string;
  avatarAnimalId?: string;
};

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const user = await getUserById(userId);
  if (!user) throw new Error("User not found");

  if (typeof input.nickname === "string") {
    const nick = input.nickname.trim().slice(0, 32);
    if (nick.length < 1) throw new Error("Nickname required");
    user.name = nick;
    user.nameZh = nick;
  }

  if (typeof input.avatarAnimalId === "string") {
    const animal = await getAnimal(input.avatarAnimalId);
    if (!animal) throw new Error("Invalid avatar");
    user.avatarAnimalId = animal.id;
    user.avatar = animal.path;
  }

  return upsertUser(user);
}

export async function upgradeOrAttachAuth(opts: {
  email?: string;
  googleId?: string;
  name?: string;
  picture?: string;
  provider: "email" | "google";
}): Promise<UserRecord> {
  const sessionId = await getSessionUserId();
  const sessionUser = sessionId ? await getUserById(sessionId) : null;

  let existing: UserRecord | undefined;
  if (opts.googleId) existing = await getUserByGoogleId(opts.googleId);
  if (!existing && opts.email) existing = await getUserByEmail(opts.email);

  if (existing) {
    if (opts.googleId) existing.googleId = opts.googleId;
    if (opts.email) existing.email = opts.email.toLowerCase();
    existing.isGuest = false;
    existing.authProvider = opts.provider;
    if (opts.picture && !existing.avatarAnimalId) existing.avatar = opts.picture;
    await upsertUser(existing);
    await setUserSession(existing.id);
    return existing;
  }

  if (sessionUser?.isGuest) {
    sessionUser.isGuest = false;
    sessionUser.authProvider = opts.provider;
    if (opts.email) sessionUser.email = opts.email.toLowerCase();
    if (opts.googleId) sessionUser.googleId = opts.googleId;
    await upsertUser(sessionUser);
    await setUserSession(sessionUser.id);
    return sessionUser;
  }

  const animal = await randomAnimal();
  const nickname = opts.name?.trim() || randomNickname(animal);
  const user = blankStats({
    id: newId("user"),
    name: nickname,
    nameZh: nickname,
    email: opts.email?.toLowerCase() ?? "",
    googleId: opts.googleId,
    avatar: animal.path,
    avatarAnimalId: animal.id,
    isGuest: false,
    authProvider: opts.provider,
  });
  await upsertUser(user);
  await setUserSession(user.id);
  return user;
}

export async function loginWithPassword(
  username: string,
  password: string,
): Promise<UserRecord> {
  const { getUserByUsername } = await import("@/lib/db");
  const { verifyPassword } = await import("@/lib/password");

  const normalized = username.trim().toLowerCase();
  if (!normalized || !password) {
    throw new Error("Username and password required");
  }

  const user = await getUserByUsername(normalized);
  if (!user || user.status !== "active") {
    throw new Error("Invalid username or password");
  }
  if (!verifyPassword(password, user.passwordHash)) {
    throw new Error("Invalid username or password");
  }

  user.isGuest = false;
  user.authProvider = user.authProvider || "password";
  await upsertUser(user);
  await setUserSession(user.id);
  return user;
}

type OtpRecord = { email: string; code: string; exp: number };

async function readOtps(): Promise<OtpRecord[]> {
  try {
    const raw = await fs.readFile(OTP_PATH, "utf8");
    return JSON.parse(raw) as OtpRecord[];
  } catch {
    return [];
  }
}

async function writeOtps(rows: OtpRecord[]) {
  await fs.mkdir(path.dirname(OTP_PATH), { recursive: true });
  const live = rows.filter((r) => r.exp > Date.now());
  await fs.writeFile(OTP_PATH, JSON.stringify(live, null, 2), "utf8");
}

export async function issueEmailOtp(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error("Invalid email");
  }
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const rows = await readOtps();
  const next = rows.filter((r) => r.email !== normalized);
  next.push({ email: normalized, code, exp: Date.now() + 10 * 60 * 1000 });
  await writeOtps(next);
  console.info(`[supp-auth] OTP for ${normalized}: ${code}`);
  return {
    email: normalized,
    devCode: process.env.NODE_ENV !== "production" ? code : undefined,
  };
}

export async function verifyEmailOtp(email: string, code: string) {
  const normalized = email.trim().toLowerCase();
  const rows = await readOtps();
  const match = rows.find(
    (r) => r.email === normalized && r.code === code && r.exp > Date.now(),
  );
  if (!match) throw new Error("Invalid or expired code");
  await writeOtps(rows.filter((r) => r.email !== normalized));
  return upgradeOrAttachAuth({ email: normalized, provider: "email" });
}

export function newOAuthState() {
  return randomBytes(16).toString("hex");
}

export const GOOGLE_STATE_COOKIE = "supp_google_oauth_state";
