import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";

const KEYLEN = 64;

/** Hash a password for storage (scrypt + salt). */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEYLEN).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

/** Verify a password against a stored hash. */
export function verifyPassword(password: string, stored?: string | null): boolean {
  if (!stored || !password) return false;
  const [algo, salt, hash] = stored.split("$");
  if (algo !== "scrypt" || !salt || !hash) return false;
  try {
    const derived = scryptSync(password, salt, KEYLEN);
    const expected = Buffer.from(hash, "hex");
    if (expected.length !== derived.length) return false;
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/** Deterministic password for dummy user n (1-based). */
export function dummyPasswordFor(index: number): string {
  return `Demo${String(index).padStart(3, "0")}!`;
}

/** Deterministic username for dummy user n (1-based). */
export function dummyUsernameFor(index: number): string {
  return `demo${String(index).padStart(3, "0")}`;
}

/** Stable hash used only for deterministic scrypt salts in seed data. */
export function deterministicHashPassword(password: string, username: string): string {
  const salt = createHash("sha256").update(`supp-dummy:${username}`).digest("hex").slice(0, 32);
  const hash = scryptSync(password, salt, KEYLEN).toString("hex");
  return `scrypt$${salt}$${hash}`;
}
