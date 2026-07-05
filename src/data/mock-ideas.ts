export type Idea = {
  id: string;
  title: string;
  summary: string;
  location: string;
  date: string;
  participantCount: number;
  maxParticipants: number;
  organizer: string;
  tags: string[];
  description: string;
};

export const mockIdeas: Idea[] = [
  {
    id: "sunrise-hike",
    title: "Sunrise hike & coffee",
    summary: "Early morning trail walk followed by pour-over at a local café.",
    location: "Victoria Peak, Hong Kong",
    date: "Sat, 12 Jul · 5:30 AM",
    participantCount: 4,
    maxParticipants: 8,
    organizer: "Alex Chen",
    tags: ["outdoors", "wellness", "social"],
    description:
      "Meet at the tram station before dawn. We'll take a gentle pace up the trail, pause for sunrise photos, then head to a nearby café for coffee and conversation. All fitness levels welcome.",
  },
  {
    id: "pottery-workshop",
    title: "Beginner pottery wheel session",
    summary: "Two-hour intro class — make and glaze your first bowl.",
    location: "Sham Shui Po Studio",
    date: "Sun, 13 Jul · 2:00 PM",
    participantCount: 6,
    maxParticipants: 10,
    organizer: "Maya Lo",
    tags: ["craft", "creative", "indoor"],
    description:
      "No experience needed. An instructor will guide you through centering clay on the wheel, shaping a small bowl, and choosing a glaze. Pieces are fired and ready for pickup in two weeks.",
  },
  {
    id: "night-market-food",
    title: "Night market food crawl",
    summary: "Sample street food across three districts with a local guide.",
    location: "Temple Street → Mong Kok",
    date: "Fri, 18 Jul · 7:00 PM",
    participantCount: 9,
    maxParticipants: 12,
    organizer: "Jordan Ng",
    tags: ["food", "culture", "evening"],
    description:
      "We'll visit hand-picked stalls for curry fish balls, egg waffles, and more. Vegetarian options available. Bring cash and an empty stomach.",
  },
  {
    id: "book-club-park",
    title: "Outdoor book club picnic",
    summary: "Discuss this month's short story in the park — bring a snack to share.",
    location: "Kowloon Park",
    date: "Sat, 19 Jul · 4:00 PM",
    participantCount: 3,
    maxParticipants: 15,
    organizer: "Priya Shah",
    tags: ["books", "social", "relaxed"],
    description:
      "This month we're reading a short story by Haruki Murakami (link in the idea details once you join). Casual format — no pressure to finish, just come ready to chat.",
  },
  {
    id: "urban-sketching",
    title: "Urban sketching walk",
    summary: "Sketch architecture and street scenes along the waterfront.",
    location: "Tsim Sha Tsui Promenade",
    date: "Sun, 20 Jul · 10:00 AM",
    participantCount: 5,
    maxParticipants: 12,
    organizer: "Leo Park",
    tags: ["art", "outdoors", "creative"],
    description:
      "Bring your own sketchbook and pens. We'll stop at three viewpoints with optional mini demos. Beginners and experienced sketchers alike.",
  },
  {
    id: "language-exchange",
    title: "Casual language exchange",
    summary: "Practice English, Mandarin, and Cantonese over board games.",
    location: "Central co-working lounge",
    date: "Wed, 23 Jul · 6:30 PM",
    participantCount: 8,
    maxParticipants: 16,
    organizer: "Supp Community",
    tags: ["language", "social", "indoor"],
    description:
      "Rotating table format — 15 minutes per language pair, then switch. Board games on hand to keep things relaxed. All levels welcome.",
  },
];

export function getIdeaById(id: string): Idea | undefined {
  return mockIdeas.find((idea) => idea.id === id);
}

export function searchIdeas(query: string): Idea[] {
  const q = query.trim().toLowerCase();
  if (!q) return mockIdeas;

  return mockIdeas.filter(
    (idea) =>
      idea.title.toLowerCase().includes(q) ||
      idea.summary.toLowerCase().includes(q) ||
      idea.location.toLowerCase().includes(q) ||
      idea.tags.some((tag) => tag.toLowerCase().includes(q)),
  );
}
