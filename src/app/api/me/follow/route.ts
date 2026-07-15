import { NextResponse } from "next/server";
import { ensureSessionUser, publicUser } from "@/lib/user-auth";
import { setFollow } from "@/lib/social";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { userId?: string; active?: boolean };
    if (!body.userId || typeof body.active !== "boolean") {
      return NextResponse.json(
        { error: "userId and active required" },
        { status: 400 },
      );
    }
    const me = await ensureSessionUser();
    const updated = await setFollow(me, body.userId, body.active);
    return NextResponse.json({ user: publicUser(updated) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    const status = message === "User not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
