/**
 * Builds 400 unique animal avatar illustrations (SVG) + animals.json catalog.
 * Run: node scripts/generate-animal-avatars.mjs
 */
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "avatars", "animals");
const DB_FILE = path.join(ROOT, "data", "avatars", "animals.json");

const SPECIES = [
  "Fox", "Wolf", "Bear", "Panda", "Koala", "Cat", "Lion", "Tiger", "Leopard", "Cheetah",
  "Rabbit", "Hare", "Deer", "Moose", "Elk", "Otter", "Beaver", "Raccoon", "Badger", "Skunk",
  "Hedgehog", "Squirrel", "Chipmunk", "Mouse", "Rat", "Hamster", "Guinea Pig", "Capybara", "Sloth", "Monkey",
  "Gorilla", "Orangutan", "Lemur", "Dog", "Husky", "Corgi", "Puppy", "Seal", "Walrus", "Penguin",
  "Owl", "Eagle", "Hawk", "Falcon", "Parrot", "Toucan", "Flamingo", "Swan", "Duck", "Goose",
  "Chicken", "Rooster", "Peacock", "Crow", "Raven", "Sparrow", "Robin", "Dove", "Pigeon", "Hummingbird",
  "Dolphin", "Whale", "Shark", "Octopus", "Squid", "Crab", "Lobster", "Shrimp", "Jellyfish", "Starfish",
  "Turtle", "Tortoise", "Frog", "Toad", "Lizard", "Gecko", "Chameleon", "Snake", "Cobra", "Alligator",
  "Crocodile", "Dinosaur", "Axolotl", "Newt", "Salamander", "Goat", "Sheep", "Lamb", "Cow", "Bull",
  "Horse", "Pony", "Zebra", "Donkey", "Pig", "Boar", "Alpaca", "Llama", "Camel", "Elephant",
  "Rhino", "Hippo", "Giraffe", "Antelope", "Buffalo", "Bison", "Yak", "Kangaroo", "Wallaby", "Platypus",
  "Echidna", "Bat", "Bee", "Butterfly", "Dragonfly", "Ladybug", "Beetle", "Ant", "Snail", "Caterpillar",
];

const ADJECTIVES = [
  "Cosmic", "Sunny", "Midnight", "Neon", "Velvet", "Pixel", "Fuzzy", "Bold", "Quiet", "Lucky",
  "Swift", "Cozy", "Wild", "Gentle", "Zesty", "Chill", "Sparkly", "Rusty", "Mellow", "Electric",
  "Pepper", "Minty", "Coral", "Indigo", "Amber", "Jade", "Ruby", "Ivory", "Shadow", "Bubble",
  "Crispy", "Golden", "Silver", "Stormy", "Breezy", "Peachy", "Berry", "Maple", "Nova", "Orbit",
];

const PALETTES = [
  ["#FF6B6B", "#FFE66D", "#2C3E50"],
  ["#4ECDC4", "#1A535C", "#F7FFF7"],
  ["#FF9F1C", "#2EC4B6", "#FFF8F0"],
  ["#9B5DE5", "#F15BB5", "#FEE440"],
  ["#00BBF9", "#00F5D4", "#FEE440"],
  ["#EF476F", "#FFD166", "#06D6A0"],
  ["#118AB2", "#073B4C", "#FFD166"],
  ["#F72585", "#7209B7", "#4CC9F0"],
  ["#E76F51", "#2A9D8F", "#E9C46A"],
  ["#264653", "#E9C46A", "#F4A261"],
  ["#FF8FAB", "#FFB3C6", "#FFE5EC"],
  ["#80ED99", "#57CC99", "#22577A"],
  ["#F94144", "#F3722C", "#F9C74F"],
  ["#577590", "#43AA8B", "#90BE6D"],
  ["#5E60CE", "#6930C3", "#64DFDF"],
  ["#FF7B00", "#FF8800", "#FFB700"],
  ["#006D77", "#83C5BE", "#EDF6F9"],
  ["#D62828", "#F77F00", "#FCBF49"],
  ["#3D5A80", "#98C1D9", "#EE6C4D"],
  ["#22223B", "#4A4E69", "#9A8C98"],
];

/** Shape family per species index — keeps silhouettes varied */
const FAMILIES = ["mammal", "bird", "aquatic", "reptile", "bug", "farm"];

function familyFor(speciesIndex) {
  return FAMILIES[speciesIndex % FAMILIES.length];
}

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mammalSvg(c1, c2, c3, seed) {
  const ear = 18 + (seed % 8);
  const snout = 10 + (seed % 6);
  return `
  <circle cx="64" cy="70" r="38" fill="${c1}"/>
  <ellipse cx="38" cy="42" rx="${ear}" ry="${ear + 6}" fill="${c1}"/>
  <ellipse cx="90" cy="42" rx="${ear}" ry="${ear + 6}" fill="${c1}"/>
  <ellipse cx="38" cy="44" rx="${ear - 6}" ry="${ear}" fill="${c2}"/>
  <ellipse cx="90" cy="44" rx="${ear - 6}" ry="${ear}" fill="${c2}"/>
  <circle cx="50" cy="66" r="5" fill="${c3}"/>
  <circle cx="78" cy="66" r="5" fill="${c3}"/>
  <circle cx="51.5" cy="65" r="2" fill="#fff"/>
  <circle cx="79.5" cy="65" r="2" fill="#fff"/>
  <ellipse cx="64" cy="${78 + snout / 4}" rx="${snout}" ry="${snout * 0.7}" fill="${c2}"/>
  <ellipse cx="64" cy="${80 + snout / 4}" rx="4" ry="3" fill="${c3}"/>
  <path d="M56 90 Q64 96 72 90" stroke="${c3}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  `;
}

function birdSvg(c1, c2, c3, seed) {
  const crest = seed % 2 === 0;
  return `
  <ellipse cx="64" cy="72" rx="34" ry="36" fill="${c1}"/>
  ${crest ? `<path d="M48 40 Q64 18 80 40" fill="${c2}"/>` : ""}
  <circle cx="52" cy="64" r="5.5" fill="${c3}"/>
  <circle cx="76" cy="64" r="5.5" fill="${c3}"/>
  <circle cx="53.5" cy="63" r="2" fill="#fff"/>
  <circle cx="77.5" cy="63" r="2" fill="#fff"/>
  <path d="M64 74 L88 78 L64 86 Z" fill="${c2}"/>
  <ellipse cx="40" cy="90" rx="14" ry="8" fill="${c2}" transform="rotate(-20 40 90)"/>
  <ellipse cx="88" cy="90" rx="14" ry="8" fill="${c2}" transform="rotate(20 88 90)"/>
  `;
}

function aquaticSvg(c1, c2, c3, seed) {
  const fin = 12 + (seed % 10);
  return `
  <ellipse cx="64" cy="68" rx="40" ry="28" fill="${c1}"/>
  <path d="M24 68 Q8 48 14 72 Q8 92 24 72 Z" fill="${c2}"/>
  <path d="M64 ${42 - fin / 4} L${64 - fin} 52 L${64 + fin} 52 Z" fill="${c2}"/>
  <circle cx="78" cy="64" r="6" fill="${c3}"/>
  <circle cx="80" cy="63" r="2.2" fill="#fff"/>
  <path d="M86 74 Q92 76 88 80" stroke="${c3}" stroke-width="2" fill="none"/>
  <ellipse cx="50" cy="78" rx="8" ry="5" fill="${c2}" opacity="0.55"/>
  `;
}

function reptileSvg(c1, c2, c3, seed) {
  return `
  <ellipse cx="64" cy="74" rx="36" ry="30" fill="${c1}"/>
  <ellipse cx="64" cy="48" rx="22" ry="18" fill="${c1}"/>
  <circle cx="54" cy="46" r="4.5" fill="${c3}"/>
  <circle cx="74" cy="46" r="4.5" fill="${c3}"/>
  <circle cx="55" cy="45" r="1.6" fill="#fff"/>
  <circle cx="75" cy="45" r="1.6" fill="#fff"/>
  <ellipse cx="64" cy="56" rx="8" ry="5" fill="${c2}"/>
  <path d="M40 70 L50 66 L46 78 Z" fill="${c2}"/>
  <path d="M88 70 L78 66 L82 78 Z" fill="${c2}"/>
  <path d="M48 88 Q64 ${(seed % 2) * 6 + 92} 80 88" stroke="${c3}" stroke-width="2" fill="none"/>
  `;
}

function bugSvg(c1, c2, c3, seed) {
  return `
  <ellipse cx="64" cy="78" rx="28" ry="32" fill="${c1}"/>
  <circle cx="64" cy="48" r="18" fill="${c1}"/>
  <line x1="50" y1="36" x2="40" y2="22" stroke="${c3}" stroke-width="3" stroke-linecap="round"/>
  <line x1="78" y1="36" x2="88" y2="22" stroke="${c3}" stroke-width="3" stroke-linecap="round"/>
  <circle cx="40" cy="20" r="4" fill="${c2}"/>
  <circle cx="88" cy="20" r="4" fill="${c2}"/>
  <circle cx="56" cy="48" r="4" fill="${c3}"/>
  <circle cx="72" cy="48" r="4" fill="${c3}"/>
  <path d="M44 70 Q64 60 84 70" stroke="${c2}" stroke-width="3" fill="none"/>
  <path d="M46 86 Q64 78 82 86" stroke="${c2}" stroke-width="3" fill="none"/>
  ${(seed % 2) ? `<ellipse cx="36" cy="70" rx="14" ry="8" fill="${c2}" opacity="0.5"/><ellipse cx="92" cy="70" rx="14" ry="8" fill="${c2}" opacity="0.5"/>` : ""}
  `;
}

function farmSvg(c1, c2, c3, seed) {
  return `
  <ellipse cx="64" cy="78" rx="36" ry="32" fill="${c1}"/>
  <circle cx="64" cy="52" r="26" fill="${c1}"/>
  <ellipse cx="40" cy="40" rx="10" ry="14" fill="${c2}"/>
  <ellipse cx="88" cy="40" rx="10" ry="14" fill="${c2}"/>
  <circle cx="54" cy="52" r="5" fill="${c3}"/>
  <circle cx="74" cy="52" r="5" fill="${c3}"/>
  <circle cx="55.5" cy="51" r="1.8" fill="#fff"/>
  <circle cx="75.5" cy="51" r="1.8" fill="#fff"/>
  <ellipse cx="64" cy="64" rx="${10 + (seed % 5)}" ry="7" fill="${c2}"/>
  <path d="M56 72 Q64 78 72 72" stroke="${c3}" stroke-width="2" fill="none"/>
  `;
}

const DRAW = { mammal: mammalSvg, bird: birdSvg, aquatic: aquaticSvg, reptile: reptileSvg, bug: bugSvg, farm: farmSvg };

function buildSvg({ id, species, adj, palette, family, seed }) {
  const [c1, c2, c3] = palette;
  const face = DRAW[family](c1, c2, c3, seed);
  const spots = seed % 3 === 0
    ? `<circle cx="30" cy="110" r="4" fill="${c2}" opacity="0.35"/><circle cx="100" cy="108" r="3" fill="${c3}" opacity="0.3"/>`
    : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128" role="img" aria-label="${adj} ${species}">
  <defs>
    <radialGradient id="bg-${id}" cx="50%" cy="40%" r="65%">
      <stop offset="0%" stop-color="${c2}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${c1}" stop-opacity="0.15"/>
    </radialGradient>
  </defs>
  <rect width="128" height="128" rx="64" fill="url(#bg-${id})"/>
  <rect width="128" height="128" rx="64" fill="${c3}" opacity="0.08"/>
  ${face}
  ${spots}
</svg>
`;
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.mkdir(path.dirname(DB_FILE), { recursive: true });

  const seen = new Set();
  const animals = [];
  let i = 0;

  // Deterministic unique combos until 400
  while (animals.length < 400) {
    const species = SPECIES[i % SPECIES.length];
    const adj = ADJECTIVES[Math.floor(i / SPECIES.length) % ADJECTIVES.length];
    const palette = PALETTES[i % PALETTES.length];
    const secondaryShift = Math.floor(i / (SPECIES.length * ADJECTIVES.length));
    // Rotate palette colors for extra uniqueness beyond base grid
    const rotated = [
      palette[(0 + secondaryShift) % 3],
      palette[(1 + secondaryShift) % 3],
      palette[(2 + secondaryShift) % 3],
    ];
    const key = `${adj}|${species}|${rotated.join(",")}|${i % 7}`;
    if (seen.has(key)) {
      i++;
      continue;
    }
    seen.add(key);

    const n = animals.length + 1;
    const id = `animal-${String(n).padStart(3, "0")}`;
    const family = familyFor(SPECIES.indexOf(species));
    const seed = hash(key);
    const nicknameHint = `${adj} ${species}`;
    const file = `${id}.svg`;
    const svg = buildSvg({ id, species, adj, palette: rotated, family, seed });
    await fs.writeFile(path.join(OUT_DIR, file), svg, "utf8");

    animals.push({
      id,
      species,
      adjective: adj,
      nicknameHint,
      family,
      palette: rotated,
      path: `/avatars/animals/${file}`,
    });
    i++;
  }

  const db = {
    version: 1,
    generatedAt: new Date().toISOString(),
    count: animals.length,
    animals,
  };
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), "utf8");
  console.log(`Wrote ${animals.length} avatars → ${OUT_DIR}`);
  console.log(`Catalog → ${DB_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
