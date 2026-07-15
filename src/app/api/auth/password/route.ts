import { NextResponse } from "next/server";
import { loginWithPassword, publicUser } from "@/lib/user-auth";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    username?: string;
    password?: string;
  };

  try {
    const user = await loginWithPassword(
      String(body.username || ""),
      String(body.password || ""),
    );
    return NextResponse.json({ user: publicUser(user) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Login failed";
    const status =
      message.includes("required") || message.includes("Invalid") ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
