import { NextResponse } from "next/server";
import { publicUser, verifyEmailOtp } from "@/lib/user-auth";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string; code?: string };
    if (!body.email || !body.code) {
      return NextResponse.json({ error: "Email and code required" }, { status: 400 });
    }
    const user = await verifyEmailOtp(body.email, body.code.trim());
    return NextResponse.json({ user: publicUser(user) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
