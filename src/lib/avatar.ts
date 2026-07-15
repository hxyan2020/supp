/** Fallback when a user avatar URL is missing or fails to load. */
export const DEFAULT_AVATAR = "/avatars/default.svg";

const MISSING_LOCAL = new Set([
  "/images/avatar-1.png",
  "/images/avatar-user.jpg",
  "/images/persona.png",
]);

export function resolveAvatar(url?: string | null): string {
  if (!url) return DEFAULT_AVATAR;
  const trimmed = url.trim();
  if (!trimmed) return DEFAULT_AVATAR;
  if (MISSING_LOCAL.has(trimmed)) return DEFAULT_AVATAR;
  return trimmed;
}
