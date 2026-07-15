import { NextResponse } from "next/server";
import { ensureSessionUser, publicUser } from "@/lib/user-auth";
import { getFollowers, getSimilarSouls } from "@/lib/social";

export async function GET() {
  try {
    const me = await ensureSessionUser();
    const [similar, followers] = await Promise.all([
      getSimilarSouls(me),
      getFollowers(me),
    ]);
    return NextResponse.json({
      user: publicUser(me),
      similar,
      followers,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
