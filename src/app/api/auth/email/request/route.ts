import { NextResponse } from "next/server";
import { issueEmailOtp } from "@/lib/user-auth";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string };
    if (!body.email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }
    const result = await issueEmailOtp(body.email);
    return NextResponse.json({
      ok: true,
      email: result.email,
      ...(result.devCode ? { devCode: result.devCode } : {}),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
