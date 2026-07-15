import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { deleteUser, listUsers, upsertUser } from "@/lib/db";
import { sanitizeUserForAdmin } from "@/lib/dummy-users";
import { hashPassword } from "@/lib/password";
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
  const body = (await req.json()) as Partial<UserRecord> & {
    password?: string;
  };
  const existing = (await listUsers()).find((u) => u.id === id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const username =
    body.username !== undefined
      ? body.username.trim().toLowerCase() || undefined
      : existing.username;

  const passwordHash =
    typeof body.password === "string" && body.password.trim()
      ? hashPassword(body.password.trim())
      : existing.passwordHash;

  // Never allow clients to overwrite hash / pass plaintext into the record
  const {
    passwordHash: _ignoreHash,
    password: _ignorePassword,
    ...safeBody
  } = body as Partial<UserRecord> & { password?: string };

  const saved = await upsertUser({
    ...existing,
    ...safeBody,
    id,
    username,
    passwordHash,
    experienced:
      body.experienced != null ? Number(body.experienced) : existing.experienced,
    favorited:
      body.favorited != null ? Number(body.favorited) : existing.favorited,
    claimed: body.claimed != null ? Number(body.claimed) : existing.claimed,
    favoritedIds: body.favoritedIds ?? existing.favoritedIds,
    experiencedIds: body.experiencedIds ?? existing.experiencedIds,
    joinedIds: body.joinedIds ?? existing.joinedIds,
    authProvider:
      passwordHash || username
        ? body.authProvider || existing.authProvider || "password"
        : existing.authProvider,
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json({ user: sanitizeUserForAdmin(saved) });
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
