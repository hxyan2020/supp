import { promises as fs } from "fs";
import path from "path";
import type { Category, Sensation } from "@/data/mock-ideas";
import type { IdeaRecord, UserRecord } from "@/lib/types";

export type PersonaRole = {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  avatar: string;
  mbtiHint: string;
  weights: {
    categories: Partial<Record<Category, number>>;
    sensations: Partial<Record<Sensation, number>>;
  };
};

type RolesDb = { version: number; roles: PersonaRole[] };

const DB_FILE = path.join(process.cwd(), "data", "personas", "roles.json");

let cache: RolesDb | null = null;

export async function loadPersonaRoles(): Promise<PersonaRole[]> {
  if (!cache) {
    const raw = await fs.readFile(DB_FILE, "utf8");
    cache = JSON.parse(raw) as RolesDb;
  }
  return cache.roles;
}

export async function getPersonaRole(id: string): Promise<PersonaRole | undefined> {
  const roles = await loadPersonaRoles();
  return roles.find((r) => r.id === id);
}

export type IdeaSignal = Pick<IdeaRecord, "id" | "categories" | "sensation">;

/** Experienced ideas weigh more than collected (favorited) ones. */
const EXPERIENCED_WEIGHT = 2;
const FAVORITED_WEIGHT = 1;

export function scoreRole(
  role: PersonaRole,
  ideas: { idea: IdeaSignal; weight: number }[],
): number {
  let score = 0;
  for (const { idea, weight } of ideas) {
    for (const cat of idea.categories) {
      score += (role.weights.categories[cat] ?? 0) * weight;
    }
    score += (role.weights.sensations[idea.sensation] ?? 0) * weight;
  }
  return score;
}

export type PersonaAssignment = {
  unlocked: boolean;
  role: PersonaRole | null;
  scores: Record<string, number>;
  signalCount: number;
};

export async function assignPersonaFromIdeas(
  ideas: { idea: IdeaSignal; weight: number }[],
): Promise<PersonaAssignment> {
  const roles = await loadPersonaRoles();
  const signalCount = ideas.length;
  if (signalCount === 0) {
    return { unlocked: false, role: null, scores: {}, signalCount: 0 };
  }

  const scores: Record<string, number> = {};
  let best: PersonaRole | null = null;
  let bestScore = -1;

  for (const role of roles) {
    const s = scoreRole(role, ideas);
    scores[role.id] = s;
    if (s > bestScore || (s === bestScore && best && role.id < best.id)) {
      bestScore = s;
      best = role;
    }
  }

  return { unlocked: true, role: best, scores, signalCount };
}

export function collectUserIdeaSignals(
  user: UserRecord,
  ideaById: (id: string) => IdeaSignal | undefined,
): { idea: IdeaSignal; weight: number }[] {
  const weighted = new Map<string, { idea: IdeaSignal; weight: number }>();

  for (const id of user.favoritedIds ?? []) {
    const idea = ideaById(id);
    if (!idea) continue;
    const prev = weighted.get(id);
    weighted.set(id, {
      idea,
      weight: (prev?.weight ?? 0) + FAVORITED_WEIGHT,
    });
  }

  for (const id of user.experiencedIds ?? []) {
    const idea = ideaById(id);
    if (!idea) continue;
    const prev = weighted.get(id);
    weighted.set(id, {
      idea,
      weight: (prev?.weight ?? 0) + EXPERIENCED_WEIGHT,
    });
  }

  return [...weighted.values()];
}

export function applyPersonaToUser(
  user: UserRecord,
  assignment: PersonaAssignment,
): UserRecord {
  if (!assignment.unlocked || !assignment.role) {
    user.personaRoleId = undefined;
    user.personaAvatar = undefined;
    user.persona = "";
    user.personaZh = "";
    user.personaDesc = "";
    user.personaDescZh = "";
    return user;
  }

  const role = assignment.role;
  user.personaRoleId = role.id;
  user.personaAvatar = role.avatar;
  user.persona = role.name;
  user.personaZh = role.nameZh;
  user.personaDesc = role.description;
  user.personaDescZh = role.descriptionZh;
  return user;
}
