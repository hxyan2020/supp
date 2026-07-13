import { NextResponse } from "next/server";
import { checkPassword, setAdminSession } from "@/lib/admin-auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const password = String(body.password || "");
  if (!checkPassword(password)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }
  await setAdminSession();
  return NextResponse.json({ ok: true });
}
