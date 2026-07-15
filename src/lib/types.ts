import type {
  Category,
  Engagement,
  Sensation,
  SocialEmbed,
} from "@/data/mock-ideas";

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
  engagement?: Engagement;
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
  steps?: string[];
  stepsZh?: string[];
  needs?: string[];
  needsZh?: string[];
  socialEmbeds?: SocialEmbed[];
  published: boolean;
  /**
   * User-created idea workflow:
   * draft = unfinished, rejected = failed screening, published = live
   */
  creationStatus?: "draft" | "rejected" | "published";
  creatorUserId?: string;
  creatorName?: string;
  creatorNameZh?: string;
  rejectionReason?: string;
  rejectionReasonZh?: string;
  /** Cover assigned from repository (locked after create) */
  imageAssignedFromRepo?: boolean;
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
  /** References an entry in data/avatars/animals.json */
  avatarAnimalId?: string;
  locale: string;
  city: string;
  country: string;
  experienced: number;
  favorited: number;
  claimed: number;
  percentile?: number;
  persona: string;
  personaZh: string;
  personaDesc?: string;
  personaDescZh?: string;
  favoritedIds: string[];
  experiencedIds: string[];
  /** ISO timestamps for when an idea was marked experienced (for month grouping) */
  experiencedAt?: Record<string, string>;
  joinedIds: string[];
  /** Users this account follows */
  followingIds?: string[];
  /** Users who follow this account */
  followerIds?: string[];
  status: "active" | "suspended";
  isGuest?: boolean;
  authProvider?: "guest" | "email" | "google" | "password";
  googleId?: string;
  /** Login username (unique, optional for guests/OAuth) */
  username?: string;
  /** scrypt$hash — never expose to clients */
  passwordHash?: string;
  /** MBTI-like role id from data/personas/roles.json */
  personaRoleId?: string;
  personaAvatar?: string;
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

export type CommentRecord = {
  id: string;
  ideaId: string;
  parentId?: string;
  userId?: string;
  authorName: string;
  authorNameZh: string;
  authorAvatar: string;
  city: string;
  cityZh: string;
  country: string;
  countryZh: string;
  body: string;
  bodyZh: string;
  postedAt: string;
  images: string[];
  likes: number;
  status: "published" | "blocked";
  blockReason?: string;
};

export type DbShape = {
  ideas: IdeaRecord[];
  users: UserRecord[];
  comments: CommentRecord[];
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
