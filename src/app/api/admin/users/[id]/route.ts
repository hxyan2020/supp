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
  return NextResponse.json({ user: await upsertUser({ ...existing, ...body, id }) });
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
