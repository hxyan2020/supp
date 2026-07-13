import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listAllIdeas, upsertIdea, newId } from "@/lib/db";
import type { IdeaRecord } from "@/lib/types";

async function guard() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  const ideas = await listAllIdeas();
  return NextResponse.json({ ideas });
}

export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const body = (await req.json()) as Partial<IdeaRecord>;
  const now = new Date().toISOString();
  const idea: IdeaRecord = {
    id: body.id || newId("idea"),
    title: body.title || "",
    titleZh: body.titleZh || body.title || "",
    summary: body.summary || "",
    summaryZh: body.summaryZh || body.summary || "",
    description: body.description || "",
    descriptionZh: body.descriptionZh || body.description || "",
    tip: body.tip || "",
    tipZh: body.tipZh || body.tip || "",
    location: body.location || "",
    locationZh: body.locationZh || body.location || "",
    address: body.address || "",
    addressZh: body.addressZh || body.address || "",
    lat: Number(body.lat) || 0,
    lng: Number(body.lng) || 0,
    date: body.date || "",
    durationMin: Number(body.durationMin) || 60,
    fee: Number(body.fee) || 0,
    weather: body.weather || "any",
    city: body.city || "",
    country: body.country || "",
    categories: body.categories || ["social"],
    sensation: body.sensation || "curious",
    image: body.image || "/images/event-park.jpg",
    organizer: body.organizer || "Supp",
    organizerZh: body.organizerZh || "嘛呢",
    organizerAvatar: body.organizerAvatar || "/images/avatar-1.png",
    experiencedCount: Number(body.experiencedCount) || 0,
    favoritedCount: Number(body.favoritedCount) || 0,
    participantCount: Number(body.participantCount) || 0,
    maxParticipants: Number(body.maxParticipants) || 20,
    relevance: Number(body.relevance) || 70,
    tags: body.tags || [],
    published: body.published ?? true,
    sourceUrl: body.sourceUrl,
    sourcePlatform: body.sourcePlatform,
    createdAt: body.createdAt || now,
    updatedAt: now,
  };
  const saved = await upsertIdea(idea);
  return NextResponse.json({ idea: saved });
}
