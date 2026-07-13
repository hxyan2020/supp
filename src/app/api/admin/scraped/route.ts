import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listScrapedEvents, updateScrapedEvent } from "@/lib/db";
import { runScrapeJob } from "@/scraper/runner";

async function guard() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as
    | "pending"
    | "approved"
    | "rejected"
    | "published"
    | null;
  const events = await listScrapedEvents(status || undefined);
  return NextResponse.json({ events });
}

export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const result = await runScrapeJob({
    countryCode: body.countryCode,
    sourceIds: body.sourceIds,
    limitPerSource: body.limitPerSource ?? 10,
  });
  return NextResponse.json(result);
}

export async function PATCH(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const body = await req.json();
  const updated = await updateScrapedEvent(body.id, body.patch);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ event: updated });
}
