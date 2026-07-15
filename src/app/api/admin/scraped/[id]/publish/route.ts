import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listScrapedEvents, slugify, upsertIdea, updateScrapedEvent } from "@/lib/db";
import type { Category, Sensation } from "@/data/mock-ideas";

async function guard() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const events = await listScrapedEvents();
  const scraped = events.find((e) => e.id === id);
  if (!scraped) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const now = new Date().toISOString();
  const title = body.title || scraped.title;
  const idea = await upsertIdea({
    id: slugify(title) || `idea-${id}`,
    title,
    titleZh: body.titleZh || title,
    summary: body.summary || scraped.description.slice(0, 120),
    summaryZh: body.titleZh || title,
    description: body.description || scraped.description,
    descriptionZh: body.descriptionZh || scraped.description,
    tip: body.tip || "",
    tipZh: body.tipZh || "",
    location: body.location || scraped.venue || scraped.city,
    locationZh: body.locationZh || scraped.venue || scraped.city,
    address: body.address || scraped.address || "",
    addressZh: body.addressZh || scraped.address || "",
    lat: body.lat ?? scraped.lat ?? 0,
    lng: body.lng ?? scraped.lng ?? 0,
    date: body.date || scraped.startDate || "TBD",
    startsAt: body.startsAt || (scraped.startDate && !Number.isNaN(Date.parse(scraped.startDate))
      ? new Date(scraped.startDate).toISOString()
      : undefined),
    endsAt: body.endsAt || (scraped.endDate && !Number.isNaN(Date.parse(scraped.endDate))
      ? new Date(scraped.endDate).toISOString()
      : undefined),
    durationMin: body.durationMin || 90,
    fee: body.fee || 0,
    weather: "any",
    city: scraped.city || scraped.country,
    country: scraped.country,
    categories: (body.categories as Category[]) || ["social"],
    sensation: (body.sensation as Sensation) || "curious",
    image: body.image || scraped.imageUrl || "/images/event-park.jpg",
    organizer: body.organizer || scraped.organizer || "Supp",
    organizerZh: body.organizerZh || "嘛呢",
    organizerAvatar: "/images/avatar-1.png",
    experiencedCount: 0,
    favoritedCount: 0,
    participantCount: 0,
    maxParticipants: 50,
    relevance: body.relevance || 75,
    tags: scraped.tags,
    steps: [],
    stepsZh: [],
    needs: [],
    needsZh: [],
    socialEmbeds: [],
    published: body.published ?? true,
    sourceUrl: scraped.sourceUrl,
    sourcePlatform: scraped.sourceName,
    createdAt: now,
    updatedAt: now,
  });

  await updateScrapedEvent(id, {
    status: "published",
    reviewedAt: now,
    publishedIdeaId: idea.id,
    title: body.title || scraped.title,
    description: body.description || scraped.description,
  });

  return NextResponse.json({ idea, scrapedId: id });
}
