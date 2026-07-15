import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { GOOGLE_STATE_COOKIE, upgradeOrAttachAuth } from "@/lib/user-auth";

function appOrigin(req: Request) {
  const fromEnv =
    process.env.AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.SCRAPE_BASE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return new URL(req.url).origin;
}

function redirectMe(origin: string, locale: string, query: string) {
  return NextResponse.redirect(`${origin}/${locale}/me?${query}`);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");
  const origin = appOrigin(req);

  const jar = await cookies();
  const expected = jar.get(GOOGLE_STATE_COOKIE)?.value;
  jar.delete(GOOGLE_STATE_COOKIE);

  const locale =
    expected && expected.includes(".")
      ? expected.slice(expected.lastIndexOf(".") + 1) || "en"
      : "en";

  if (!expected || !state || expected !== state) {
    return redirectMe(origin, locale, `authError=${encodeURIComponent("Invalid OAuth state")}`);
  }
  if (oauthError) {
    return redirectMe(origin, locale, `authError=${encodeURIComponent(oauthError)}`);
  }
  if (!code) {
    return redirectMe(origin, locale, `authError=${encodeURIComponent("Missing OAuth code")}`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return redirectMe(
      origin,
      locale,
      `authError=${encodeURIComponent("Google login is not configured")}`,
    );
  }

  const redirectUri = `${origin}/api/auth/google/callback`;
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return redirectMe(
      origin,
      locale,
      `authError=${encodeURIComponent("Google token exchange failed")}`,
    );
  }

  const tokenJson = (await tokenRes.json()) as { access_token?: string };
  if (!tokenJson.access_token) {
    return redirectMe(
      origin,
      locale,
      `authError=${encodeURIComponent("No access token")}`,
    );
  }

  const profileRes = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    { headers: { Authorization: `Bearer ${tokenJson.access_token}` } },
  );
  if (!profileRes.ok) {
    return redirectMe(
      origin,
      locale,
      `authError=${encodeURIComponent("Failed to load Google profile")}`,
    );
  }

  const profile = (await profileRes.json()) as {
    id?: string;
    email?: string;
    name?: string;
    picture?: string;
  };

  if (!profile.id || !profile.email) {
    return redirectMe(
      origin,
      locale,
      `authError=${encodeURIComponent("Google profile incomplete")}`,
    );
  }

  await upgradeOrAttachAuth({
    googleId: profile.id,
    email: profile.email,
    name: profile.name,
    picture: profile.picture,
    provider: "google",
  });

  return redirectMe(origin, locale, "signedIn=1");
}
