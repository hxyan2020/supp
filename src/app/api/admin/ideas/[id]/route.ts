import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { deleteIdea, upsertIdea, listAllIdeas } from "@/lib/db";
import type { IdeaRecord } from "@/lib/types";
import {
  normalizeSocialEmbeds,
  normalizeStringList,
} from "@/lib/content-moderation";

async function guard() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await params;
  const body = (await req.json()) as Partial<IdeaRecord>;
  const ideas = await listAllIdeas();
  const existing = ideas.find((i) => i.id === id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const saved = await upsertIdea({
    ...existing,
    ...body,
    id,
    lat: body.lat != null ? Number(body.lat) : existing.lat,
    lng: body.lng != null ? Number(body.lng) : existing.lng,
    durationMin:
      body.durationMin != null ? Number(body.durationMin) : existing.durationMin,
    fee: body.fee != null ? Number(body.fee) : existing.fee,
    experiencedCount:
      body.experiencedCount != null
        ? Number(body.experiencedCount)
        : existing.experiencedCount,
    favoritedCount:
      body.favoritedCount != null
        ? Number(body.favoritedCount)
        : existing.favoritedCount,
    participantCount:
      body.participantCount != null
        ? Number(body.participantCount)
        : existing.participantCount,
    maxParticipants:
      body.maxParticipants != null
        ? Number(body.maxParticipants)
        : existing.maxParticipants,
    relevance:
      body.relevance != null ? Number(body.relevance) : existing.relevance,
    tags: body.tags ?? existing.tags,
    categories: body.categories ?? existing.categories,
    steps:
      body.steps !== undefined
        ? normalizeStringList(body.steps)
        : existing.steps ?? [],
    stepsZh:
      body.stepsZh !== undefined
        ? normalizeStringList(body.stepsZh)
        : existing.stepsZh ?? [],
    needs:
      body.needs !== undefined
        ? normalizeStringList(body.needs)
        : existing.needs ?? [],
    needsZh:
      body.needsZh !== undefined
        ? normalizeStringList(body.needsZh)
        : existing.needsZh ?? [],
    socialEmbeds:
      body.socialEmbeds !== undefined
        ? normalizeSocialEmbeds(body.socialEmbeds)
        : existing.socialEmbeds ?? [],
    updatedAt: new Date().toISOString(),
  });
  return NextResponse.json({ idea: saved });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await params;
  const ok = await deleteIdea(id);
  return NextResponse.json({ ok });
}
