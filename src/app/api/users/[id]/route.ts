import { NextResponse } from "next/server";
import { getUserById, getUserByUsername } from "@/lib/db";
import { ensureSessionUser } from "@/lib/user-auth";
import { getSimilarSouls } from "@/lib/social";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const me = await ensureSessionUser();
  const user =
    (await getUserById(id)) || (await getUserByUsername(id));
  if (!user || user.status !== "active") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const myIdeas = new Set([
    ...(me.favoritedIds ?? []),
    ...(me.experiencedIds ?? []),
  ]);
  const theirIdeas = new Set([
    ...(user.favoritedIds ?? []),
    ...(user.experiencedIds ?? []),
  ]);
  const commonIdeaIds = [...myIdeas].filter((x) => theirIdeas.has(x));
  const similar = await getSimilarSouls(user, 8);

  const unlocked = Boolean(
    user.personaRoleId &&
      ((user.favoritedIds?.length ?? 0) > 0 ||
        (user.experiencedIds?.length ?? 0) > 0),
  );

  return NextResponse.json({
    profile: {
      id: user.id,
      nickname: user.name,
      nicknameZh: user.nameZh,
      avatar: user.avatar,
      persona: user.persona,
      personaZh: user.personaZh,
      personaDesc: user.personaDesc ?? "",
      personaDescZh: user.personaDescZh ?? "",
      personaAvatar: user.personaAvatar ?? null,
      personaUnlocked: unlocked,
      personaRoleId: user.personaRoleId ?? null,
      experienced: user.experiencedIds?.length ?? user.experienced ?? 0,
      favorited: user.favoritedIds?.length ?? user.favorited ?? 0,
      percentile: user.percentile ?? 0,
      favoritedIds: user.favoritedIds ?? [],
      experiencedIds: user.experiencedIds ?? [],
      experiencedAt: user.experiencedAt ?? {},
      followerCount: user.followerIds?.length ?? 0,
      followingCount: user.followingIds?.length ?? 0,
      overlapCount: commonIdeaIds.length,
      commonIdeaIds,
      isFollowing: (me.followingIds ?? []).includes(user.id),
      isSelf: me.id === user.id,
      similar: similar
        .filter((s) => s.id !== me.id)
        .map((s) => ({
          id: s.id,
          nickname: s.nickname,
          nicknameZh: s.nicknameZh,
          avatar: s.avatar,
          persona: s.persona,
          personaZh: s.personaZh,
          overlapCount: s.overlapCount,
        })),
    },
  });
}
