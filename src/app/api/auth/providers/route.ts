import { NextResponse } from "next/server";

/** Lightweight flag so the UI can hide/show Google button. */
export async function GET() {
  return NextResponse.json({
    googleEnabled: Boolean(
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
    ),
    emailEnabled: true,
  });
}
