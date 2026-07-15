import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { upsertUser, newId } from "@/lib/db";
import {
  listUsersSansSecrets,
  sanitizeUserForAdmin,
} from "@/lib/dummy-users";
import { hashPassword } from "@/lib/password";
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
  return NextResponse.json({ users: await listUsersSansSecrets() });
}

export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const body = (await req.json()) as Partial<UserRecord> & {
    password?: string;
  };
  const now = new Date().toISOString();
  const username = body.username?.trim().toLowerCase() || undefined;
  const password =
    typeof body.password === "string" && body.password.trim()
      ? body.password.trim()
      : "";

  const user: UserRecord = {
    id: body.id || newId("user"),
    name: body.name || username || "",
    nameZh: body.nameZh || body.name || username || "",
    email: body.email || "",
    username,
    passwordHash: password ? hashPassword(password) : undefined,
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
    followingIds: body.followingIds || [],
    followerIds: body.followerIds || [],
    status: body.status || "active",
    isGuest: false,
    authProvider: password || username ? "password" : body.authProvider,
    createdAt: body.createdAt || now,
    updatedAt: now,
  };
  const saved = await upsertUser(user);
  return NextResponse.json({ user: sanitizeUserForAdmin(saved) });
}
