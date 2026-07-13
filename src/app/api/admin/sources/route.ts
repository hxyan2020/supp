import { NextResponse } from "next/server";
import { EVENT_SOURCES, TOP30_ECONOMIES } from "@/data/event-sources";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { readDb } from "@/lib/db";

async function guard() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  const db = await readDb();
  return NextResponse.json({
    economies: TOP30_ECONOMIES,
    sources: EVENT_SOURCES,
    stats: {
      ideas: db.ideas.length,
      users: db.users.length,
      scrapedPending: db.scrapedEvents.filter((e) => e.status === "pending").length,
      scrapedPublished: db.scrapedEvents.filter((e) => e.status === "published").length,
      lastScrapeRun: db.scrapeRuns[0] || null,
    },
  });
}
