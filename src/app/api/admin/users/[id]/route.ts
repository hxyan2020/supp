import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { deleteUser, listUsers, upsertUser } from "@/lib/db";
import type { UserRecord } from "@/lib/types";

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
  const body = (await req.json()) as Partial<UserRecord>;
  const existing = (await listUsers()).find((u) => u.id === id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    user: await upsertUser({
      ...existing,
      ...body,
      id,
      experienced:
        body.experienced != null ? Number(body.experienced) : existing.experienced,
      favorited:
        body.favorited != null ? Number(body.favorited) : existing.favorited,
      claimed: body.claimed != null ? Number(body.claimed) : existing.claimed,
      favoritedIds: body.favoritedIds ?? existing.favoritedIds,
      experiencedIds: body.experiencedIds ?? existing.experiencedIds,
      joinedIds: body.joinedIds ?? existing.joinedIds,
      updatedAt: new Date().toISOString(),
    }),
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await params;
  return NextResponse.json({ ok: await deleteUser(id) });
}
