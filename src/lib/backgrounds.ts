/** Curated cover photos users can auto-receive when they skip upload. */
export const BACKGROUND_PHOTOS = [
  {
    id: "hero-city",
    path: "/images/hero-city.jpg",
    label: "City",
    labelZh: "城市",
  },
  {
    id: "hero-mountain",
    path: "/images/hero-mountain.jpg",
    label: "Mountain",
    labelZh: "山野",
  },
  {
    id: "hero-landscape",
    path: "/images/hero-landscape.jpg",
    label: "Landscape",
    labelZh: "风景",
  },
  {
    id: "event-hike",
    path: "/images/event-hike.jpg",
    label: "Hike",
    labelZh: "徒步",
  },
  {
    id: "event-park",
    path: "/images/event-park.jpg",
    label: "Park",
    labelZh: "公园",
  },
  {
    id: "event-food",
    path: "/images/event-food.jpg",
    label: "Food",
    labelZh: "美食",
  },
  {
    id: "event-cafe",
    path: "/images/event-cafe.jpg",
    label: "Café",
    labelZh: "咖啡馆",
  },
  {
    id: "event-art",
    path: "/images/event-art.jpg",
    label: "Art",
    labelZh: "艺术",
  },
  {
    id: "event-night",
    path: "/images/event-night.jpg",
    label: "Night",
    labelZh: "夜色",
  },
  {
    id: "me-bg",
    path: "/images/me-bg.jpg",
    label: "Nature",
    labelZh: "自然",
  },
  {
    id: "soul-dog",
    path: "/images/soul-dog.jpg",
    label: "Companion",
    labelZh: "陪伴",
  },
  {
    id: "avatar-user",
    path: "/images/avatar-user.jpg",
    label: "Water lily",
    labelZh: "睡莲",
  },
] as const;

export type BackgroundPhoto = (typeof BACKGROUND_PHOTOS)[number];

/** Pick a stable cover from the pool using a seed string (e.g. title). */
export function assignBackgroundFromRepo(seed: string): BackgroundPhoto {
  const list = BACKGROUND_PHOTOS;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return list[hash % list.length]!;
}
