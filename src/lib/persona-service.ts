import { getIdeaById } from "@/data/mock-ideas";
import { listPublishedIdeas, upsertUser } from "@/lib/db";
import {
  applyPersonaToUser,
  assignPersonaFromIdeas,
  collectUserIdeaSignals,
} from "@/lib/persona";
import type { UserRecord } from "@/lib/types";

export async function recalculateUserPersona(
  user: UserRecord,
): Promise<UserRecord> {
  const published = await listPublishedIdeas();
  const byId = new Map(published.map((i) => [i.id, i]));

  const signals = collectUserIdeaSignals(user, (id) => {
    const fromDb = byId.get(id);
    if (fromDb) {
      return {
        id: fromDb.id,
        categories: fromDb.categories,
        sensation: fromDb.sensation,
      };
    }
    const fromMock = getIdeaById(id);
    if (!fromMock) return undefined;
    return {
      id: fromMock.id,
      categories: fromMock.categories,
      sensation: fromMock.sensation,
    };
  });

  const assignment = await assignPersonaFromIdeas(signals);
  applyPersonaToUser(user, assignment);
  user.experienced = user.experiencedIds.length;
  user.favorited = user.favoritedIds.length;
  return upsertUser(user);
}

export async function setIdeaMembership(
  user: UserRecord,
  ideaId: string,
  field: "favoritedIds" | "experiencedIds",
  active: boolean,
): Promise<UserRecord> {
  const set = new Set(user[field] ?? []);
  if (active) set.add(ideaId);
  else set.delete(ideaId);
  user[field] = [...set];

  if (field === "experiencedIds") {
    const at = { ...(user.experiencedAt ?? {}) };
    if (active) at[ideaId] = new Date().toISOString();
    else delete at[ideaId];
    user.experiencedAt = at;
  }

  return recalculateUserPersona(user);
}
