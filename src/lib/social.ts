import { listUsers, upsertUser, getUserById } from "@/lib/db";
import { resolveAvatar } from "@/lib/avatar";
import type { UserRecord } from "@/lib/types";

export type SocialCard = {
  id: string;
  nickname: string;
  nicknameZh: string;
  avatar: string;
  persona: string;
  personaZh: string;
  overlapCount: number;
  commonIdeaIds: string[];
  isFollowing: boolean;
  followedYou: boolean;
};

function ideaSet(user: UserRecord): Set<string> {
  return new Set([...(user.favoritedIds ?? []), ...(user.experiencedIds ?? [])]);
}

function toCard(
  other: UserRecord,
  me: UserRecord,
  overlapCount: number,
  commonIdeaIds: string[],
): SocialCard {
  const following = new Set(me.followingIds ?? []);
  const followers = new Set(me.followerIds ?? []);
  return {
    id: other.id,
    nickname: other.name,
    nicknameZh: other.nameZh,
    avatar: resolveAvatar(other.avatar),
    persona: other.persona,
    personaZh: other.personaZh,
    overlapCount,
    commonIdeaIds,
    isFollowing: following.has(other.id),
    followedYou: followers.has(other.id),
  };
}

export async function getSimilarSouls(me: UserRecord, limit = 8): Promise<SocialCard[]> {
  await ensureFriendTasteSeeds();
  const mine = ideaSet(me);
  if (mine.size === 0) return [];

  const users = await listUsers();
  const scored: SocialCard[] = [];

  for (const other of users) {
    if (other.id === me.id || other.status !== "active") continue;
    const theirs = ideaSet(other);
    const common = [...mine].filter((id) => theirs.has(id));
    if (common.length === 0) continue;
    scored.push(toCard(other, me, common.length, common));
  }

  return scored
    .sort((a, b) => b.overlapCount - a.overlapCount || a.nickname.localeCompare(b.nickname))
    .slice(0, limit);
}

export async function getFollowers(me: UserRecord): Promise<SocialCard[]> {
  const users = await listUsers();
  const byId = new Map(users.map((u) => [u.id, u]));
  const mine = ideaSet(me);
  const out: SocialCard[] = [];

  for (const id of me.followerIds ?? []) {
    const other = byId.get(id);
    if (!other || other.status !== "active") continue;
    const theirs = ideaSet(other);
    const common = [...mine].filter((x) => theirs.has(x));
    out.push(toCard(other, me, common.length, common));
  }

  return out;
}

export async function setFollow(
  me: UserRecord,
  targetId: string,
  active: boolean,
): Promise<UserRecord> {
  if (me.id === targetId) throw new Error("Cannot follow yourself");
  const target = await getUserById(targetId);
  if (!target || target.status !== "active") throw new Error("User not found");

  const following = new Set(me.followingIds ?? []);
  const targetFollowers = new Set(target.followerIds ?? []);

  if (active) {
    following.add(targetId);
    targetFollowers.add(me.id);
  } else {
    following.delete(targetId);
    targetFollowers.delete(me.id);
  }

  me.followingIds = [...following];
  target.followerIds = [...targetFollowers];

  await upsertUser(target);
  return upsertUser(me);
}

const FRIEND_TASTE_SEEDS: Record<
  string,
  { favoritedIds: string[]; experiencedIds: string[] }
> = {
  f1: {
    favoritedIds: ["sunrise-hike", "pottery-bowl", "night-market-crawl", "rainy-bookstore"],
    experiencedIds: ["sunrise-hike", "rooftop-yoga"],
  },
  f2: {
    favoritedIds: ["pottery-bowl", "urban-sketch", "midnight-photo", "language-boardgame"],
    experiencedIds: ["pottery-bowl", "silent-disco-ferry"],
  },
  f3: {
    favoritedIds: ["night-market-crawl", "shanghai-lane-breakfast", "sunrise-hike"],
    experiencedIds: ["night-market-crawl"],
  },
};

/** Backfill taste data on older DB seeds so similar-souls can match. */
export async function ensureFriendTasteSeeds() {
  const users = await listUsers();
  for (const seed of users) {
    const taste = FRIEND_TASTE_SEEDS[seed.id];
    if (!taste) continue;
    if ((seed.favoritedIds?.length ?? 0) > 0) continue;
    seed.favoritedIds = taste.favoritedIds;
    seed.experiencedIds = taste.experiencedIds;
    seed.experiencedAt = Object.fromEntries(
      taste.experiencedIds.map((id, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return [id, d.toISOString()];
      }),
    );
    seed.favorited = taste.favoritedIds.length;
    seed.experienced = taste.experiencedIds.length;
    seed.followingIds = seed.followingIds ?? [];
    seed.followerIds = seed.followerIds ?? [];
    await upsertUser(seed);
  }
}

/** Give new guests a couple of seed followers + shared-taste profiles. */
export async function bootstrapGuestSocial(guest: UserRecord): Promise<UserRecord> {
  const users = await listUsers();
  const seeds = users.filter((u) => u.id === "f1" || u.id === "f2" || u.id === "f3");
  if (!seeds.length) return guest;

  const followerIds = new Set(guest.followerIds ?? []);
  for (const seed of seeds.slice(0, 2)) {
    const following = new Set(seed.followingIds ?? []);
    following.add(guest.id);
    seed.followingIds = [...following];
    followerIds.add(seed.id);
    await upsertUser(seed);
  }
  guest.followerIds = [...followerIds];
  guest.followingIds = guest.followingIds ?? [];
  return upsertUser(guest);
}
