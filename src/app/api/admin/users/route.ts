import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listUsers, upsertUser, newId } from "@/lib/db";
import type { UserRecord } from "@/lib/types";

async function guard() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  return NextResponse.json({ users: await listUsers() });
}

export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const body = (await req.json()) as Partial<UserRecord>;
  const now = new Date().toISOString();
  const user: UserRecord = {
    id: body.id || newId("user"),
    name: body.name || "",
    nameZh: body.nameZh || body.name || "",
    email: body.email || "",
    avatar: body.avatar || "/images/avatar-user.jpg",
    locale: body.locale || "en",
    city: body.city || "",
    country: body.country || "",
    experienced: Number(body.experienced) || 0,
    favorited: Number(body.favorited) || 0,
    claimed: Number(body.claimed) || 0,
    persona: body.persona || "Explorer",
    personaZh: body.personaZh || "探索者",
    favoritedIds: body.favoritedIds || [],
    experiencedIds: body.experiencedIds || [],
    joinedIds: body.joinedIds || [],
    status: body.status || "active",
    createdAt: body.createdAt || now,
    updatedAt: now,
  };
  return NextResponse.json({ user: await upsertUser(user) });
}
