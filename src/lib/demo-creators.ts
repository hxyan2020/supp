/** Deterministic mapping from an idea (or any seed) onto the 120 demo creators. */

const DEMO_COUNT = 120;
const ANIMAL_COUNT = 400;

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function demoIndexForSeed(seed: string): number {
  return (hashSeed(seed) % DEMO_COUNT) + 1;
}

export function animalPathForDemoIndex(demoIndex: number): string {
  const animalNum = ((demoIndex - 1) % ANIMAL_COUNT) + 1;
  return `/avatars/animals/animal-${String(animalNum).padStart(3, "0")}.svg`;
}

/** Stable demo profile for any idea id / seed. */
export function demoCreatorForSeed(seed: string): {
  creatorUserId: string;
  organizer: string;
  organizerZh: string;
  organizerAvatar: string;
} {
  const n = demoIndexForSeed(seed);
  const id = `demo${String(n).padStart(3, "0")}`;
  return {
    creatorUserId: id,
    organizer: `Demo ${String(n).padStart(3, "0")}`,
    organizerZh: `演示 ${String(n).padStart(3, "0")}`,
    organizerAvatar: animalPathForDemoIndex(n),
  };
}

/** Fallback animal avatar path when a user has no/invalid profile photo. */
export function animalAvatarForSeed(seed: string): string {
  const n = (hashSeed(seed) % ANIMAL_COUNT) + 1;
  return `/avatars/animals/animal-${String(n).padStart(3, "0")}.svg`;
}
