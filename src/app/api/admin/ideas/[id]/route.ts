import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { deleteIdea, upsertIdea, listAllIdeas } from "@/lib/db";
import type { IdeaRecord } from "@/lib/types";

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
  const saved = await upsertIdea({ ...existing, ...body, id });
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
