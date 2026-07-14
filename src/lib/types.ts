import type { Category, Sensation } from "@/data/mock-ideas";

export type IdeaRecord = {
  id: string;
  title: string;
  titleZh: string;
  summary: string;
  summaryZh: string;
  description: string;
  descriptionZh: string;
  tip: string;
  tipZh: string;
  location: string;
  locationZh: string;
  address: string;
  addressZh: string;
  lat: number;
  lng: number;
  date: string;
  startsAt?: string;
  endsAt?: string;
  durationMin: number;
  fee: number;
  weather: "sunny" | "cloudy" | "rainy" | "any";
  city: string;
  country: string;
  categories: Category[];
  sensation: Sensation;
  image: string;
  organizer: string;
  organizerZh: string;
  organizerAvatar: string;
  experiencedCount: number;
  favoritedCount: number;
  participantCount: number;
  maxParticipants: number;
  relevance: number;
  tags: string[];
  published: boolean;
  sourceUrl?: string;
  sourcePlatform?: string;
  createdAt: string;
  updatedAt: string;
};

export type UserRecord = {
  id: string;
  name: string;
  nameZh: string;
  email: string;
  avatar: string;
  locale: string;
  city: string;
  country: string;
  experienced: number;
  favorited: number;
  claimed: number;
  persona: string;
  personaZh: string;
  favoritedIds: string[];
  experiencedIds: string[];
  joinedIds: string[];
  status: "active" | "suspended";
  createdAt: string;
  updatedAt: string;
};

export type ScrapedEventStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "published";

export type ScrapedEventRecord = {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  country: string;
  countryCode: string;
  city: string;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  venue?: string;
  address?: string;
  lat?: number;
  lng?: number;
  price?: string;
  currency?: string;
  category?: string;
  imageUrl?: string;
  organizer?: string;
  tags: string[];
  status: ScrapedEventStatus;
  scrapedAt: string;
  reviewedAt?: string;
  publishedIdeaId?: string;
  raw?: Record<string, unknown>;
};

export type EventSource = {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  url: string;
  type: "aggregator" | "ticketing" | "community" | "government" | "api";
  scrapeMethod: "eventbrite-discovery" | "meetup-search" | "html-list" | "rss" | "manual";
  scrapeUrl?: string;
  notes: string;
  priority: 1 | 2 | 3;
  robotsRespect: boolean;
  termsUrl?: string;
};

export type DbShape = {
  ideas: IdeaRecord[];
  users: UserRecord[];
  scrapedEvents: ScrapedEventRecord[];
  scrapeRuns: {
    id: string;
    startedAt: string;
    finishedAt?: string;
    sources: string[];
    totalFound: number;
    errors: string[];
  }[];
};
