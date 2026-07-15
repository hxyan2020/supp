import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  readDummyCredentials,
  seedDummyUsers,
} from "@/lib/dummy-users";

async function guard() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/** Create/refresh 120 dummy users (demo001…demo120). */
export async function POST() {
  const denied = await guard();
  if (denied) return denied;
  const result = await seedDummyUsers(120);
  return NextResponse.json({
    ok: true,
    created: result.created,
    refreshed: result.skipped,
    total: result.total,
    credentials: result.credentials,
  });
}

/** Fetch plaintext dummy credentials for admin management. */
export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  const credentials = await readDummyCredentials();
  return NextResponse.json({
    count: credentials.length,
    credentials,
    pattern: {
      username: "demo001 … demo120",
      password: "Demo001! … Demo120!",
    },
  });
}
