import type { Idea } from "@/data/mock-ideas";

export const ME_LISTS_EVENT = "supp:me-lists-changed";
const PENDING_KEY = "supp:me-lists-pending";

export type MeListChange = {
  action: "favorite" | "experienced";
  active: boolean;
  idea: Idea;
  at?: string;
};

export function notifyMeListsChanged(change: MeListChange) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(change));
  } catch {
    // ignore quota / private mode
  }
  window.dispatchEvent(new CustomEvent(ME_LISTS_EVENT, { detail: change }));
}

export function readPendingMeListChange(): MeListChange | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(PENDING_KEY);
    return JSON.parse(raw) as MeListChange;
  } catch {
    return null;
  }
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
