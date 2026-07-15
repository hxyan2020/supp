import { NextResponse } from "next/server";

function clientIp(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || null;
}

async function resolveFromIp(req: Request) {
  const ip = clientIp(req);
  const url = ip
    ? `https://ipapi.co/${encodeURIComponent(ip)}/json/`
    : "https://ipapi.co/json/";

  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "SuppMap/1.0" },
    next: { revalidate: 600 },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    latitude?: number;
    longitude?: number;
    error?: boolean;
  };
  if (data.error) return null;
  if (!Number.isFinite(data.latitude) || !Number.isFinite(data.longitude)) {
    return null;
  }
  return {
    lat: data.latitude as number,
    lng: data.longitude as number,
  };
}

/** Approximate user coordinates (GPS preferred on client; IP fallback here). */
export async function GET(req: Request) {
  try {
    const coords = await resolveFromIp(req);
    if (!coords) {
      return NextResponse.json({ error: "Unavailable" }, { status: 404 });
    }
    return NextResponse.json(
      { ...coords, source: "ip" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
