import type { Idea } from "@/data/mock-ideas";

export const ME_LISTS_EVENT = "supp:me-lists-changed";
const PENDING_KEY = "supp:me-lists-pending-queue";

export type MeListChange = {
  action: "favorite" | "experienced";
  active: boolean;
  idea: Idea;
  at?: string;
};

function readQueue(): MeListChange[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MeListChange[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: MeListChange[]) {
  if (typeof window === "undefined") return;
  try {
    if (!queue.length) sessionStorage.removeItem(PENDING_KEY);
    else sessionStorage.setItem(PENDING_KEY, JSON.stringify(queue));
  } catch {
    // ignore quota / private mode
  }
}

export function notifyMeListsChanged(change: MeListChange) {
  if (typeof window === "undefined") return;
  const queue = readQueue().filter(
    (c) => !(c.action === change.action && c.idea.id === change.idea.id),
  );
  queue.push(change);
  writeQueue(queue);
  window.dispatchEvent(new CustomEvent(ME_LISTS_EVENT, { detail: change }));
}

/** Drain all pending list changes (e.g. when Me mounts). */
export function readPendingMeListChanges(): MeListChange[] {
  const queue = readQueue();
  writeQueue([]);
  return queue;
}

/** @deprecated use readPendingMeListChanges — kept for a single-item drain */
export function readPendingMeListChange(): MeListChange | null {
  const all = readPendingMeListChanges();
  return all.length ? all[all.length - 1]! : null;
}

export function applyMeListChange(
  change: MeListChange,
  collected: Idea[],
  experienced: Idea[],
  experiencedAt: Record<string, string>,
): {
  collected: Idea[];
  experienced: Idea[];
  experiencedAt: Record<string, string>;
} {
  let nextCollected = collected;
  let nextExperienced = experienced;
  const nextAt = { ...experiencedAt };

  if (change.action === "favorite") {
    if (change.active) {
      if (!nextCollected.some((i) => i.id === change.idea.id)) {
        nextCollected = [change.idea, ...nextCollected];
      }
    } else {
      nextCollected = nextCollected.filter((i) => i.id !== change.idea.id);
    }
  } else {
    if (change.active) {
      if (!nextExperienced.some((i) => i.id === change.idea.id)) {
        nextExperienced = [change.idea, ...nextExperienced];
      }
      nextAt[change.idea.id] = change.at || new Date().toISOString();
    } else {
      nextExperienced = nextExperienced.filter((i) => i.id !== change.idea.id);
      delete nextAt[change.idea.id];
    }
  }

  return {
    collected: nextCollected,
    experienced: nextExperienced,
    experiencedAt: nextAt,
  };
}

/** Merge server lists with a local optimistic snapshot so recent toggles are never lost. */
export function mergeIdeaLists(
  server: Idea[],
  local: Idea[],
  idsPreferred: string[],
): Idea[] {
  const byId = new Map<string, Idea>();
  for (const idea of server) byId.set(idea.id, idea);
  for (const idea of local) {
    if (!byId.has(idea.id)) byId.set(idea.id, idea);
  }
  const preferred = new Set(idsPreferred);
  const out: Idea[] = [];
  for (const id of idsPreferred) {
    const idea = byId.get(id);
    if (idea) out.push(idea);
  }
  for (const idea of byId.values()) {
    if (!preferred.has(idea.id) && !out.some((i) => i.id === idea.id)) {
      out.push(idea);
    }
  }
  return out;
}
