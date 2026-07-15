import { animalAvatarForSeed } from "@/lib/demo-creators";

/** Fallback when a user avatar URL is missing or fails to load — an animal illustration. */
export const DEFAULT_AVATAR = "/avatars/animals/animal-001.svg";

const MISSING_LOCAL = new Set([
  "/images/avatar-1.png",
  "/images/avatar-user.jpg",
  "/images/persona.png",
  "/avatars/default.svg",
]);

/**
 * Resolve a usable avatar URL. Missing / broken local placeholders map onto
 * the animal illustration set (stable per URL seed).
 */
export function resolveAvatar(url?: string | null, seed?: string): string {
  if (!url) return animalAvatarForSeed(seed || "default");
  const trimmed = url.trim();
  if (!trimmed) return animalAvatarForSeed(seed || "default");
  if (MISSING_LOCAL.has(trimmed)) {
    return animalAvatarForSeed(seed || trimmed);
  }
  return trimmed;
}
