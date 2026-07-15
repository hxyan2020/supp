import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { GOOGLE_STATE_COOKIE, newOAuthState } from "@/lib/user-auth";

function appOrigin(req: Request) {
  const fromEnv =
    process.env.AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.SCRAPE_BASE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return new URL(req.url).origin;
}

export async function GET(req: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      {
        error:
          "Google login is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
      },
      { status: 503 },
    );
  }

  const url = new URL(req.url);
  const locale = url.searchParams.get("locale") || "en";
  const nonce = newOAuthState();
  const state = `${nonce}.${locale}`;

  const jar = await cookies();
  jar.set(GOOGLE_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  const redirectUri = `${appOrigin(req)}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  );
}
