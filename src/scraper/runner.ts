import * as cheerio from "cheerio";
import type { EventSource } from "@/lib/types";
import type { ScrapedEventRecord } from "@/lib/types";
import { newId } from "@/lib/db";

export type ScrapeContext = {
  source: EventSource;
  countryCode?: string;
  limit?: number;
};

const UA =
  "Mozilla/5.0 (compatible; SuppBot/1.0; +https://github.com/hxyan2020/supp)";

async function fetchHtml(url: string) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "text/html,application/json" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function baseEvent(
  source: EventSource,
  partial: Partial<ScrapedEventRecord>,
): ScrapedEventRecord {
  return {
    id: newId("scraped"),
    sourceId: source.id,
    sourceName: source.name,
    sourceUrl: partial.sourceUrl || source.url,
    country: partial.country || source.country,
    countryCode: partial.countryCode || source.countryCode,
    city: partial.city || "",
    title: partial.title || "Untitled event",
    description: partial.description || "",
    startDate: partial.startDate || "",
    endDate: partial.endDate,
    venue: partial.venue,
    address: partial.address,
    lat: partial.lat,
    lng: partial.lng,
    price: partial.price,
    currency: partial.currency,
    category: partial.category,
    imageUrl: partial.imageUrl,
    organizer: partial.organizer,
    tags: partial.tags || [],
    status: "pending",
    scrapedAt: new Date().toISOString(),
    raw: partial.raw,
  };
}

export async function scrapeEventbriteDiscovery(
  ctx: ScrapeContext,
): Promise<ScrapedEventRecord[]> {
  const url =
    ctx.source.scrapeUrl ||
    `https://www.eventbrite.com/d/${(ctx.countryCode || "online").toLowerCase()}/events/`;
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  const events: ScrapedEventRecord[] = [];

  $('[data-testid="event-card"], .event-card, article').each((_, el) => {
    if (events.length >= (ctx.limit || 20)) return false;
    const card = $(el);
    const title =
      card.find("h2, h3, .eds-event-card__formatted-name--is-clamped").first().text().trim() ||
      card.find("a").first().attr("aria-label") ||
      "";
    const href = card.find("a[href*='/e/']").first().attr("href") || "";
    const date = card.find("time, .eds-event-card__formatted-time").first().text().trim();
    const venue = card.find(".eds-event-card__formatted-location, p").last().text().trim();
    const img = card.find("img").first().attr("src");
    if (!title) return;
    const sourceUrl = href.startsWith("http") ? href : `https://www.eventbrite.com${href}`;
    events.push(
      baseEvent(ctx.source, {
        title,
        description: `${title} — discovered on Eventbrite`,
        startDate: date,
        venue,
        city: venue,
        countryCode: ctx.countryCode || ctx.source.countryCode,
        imageUrl: img,
        sourceUrl,
        category: "events",
        tags: ["eventbrite", "discovery"],
        raw: { href, date, venue },
      }),
    );
  });

  return events;
}

export async function scrapeMeetupSearch(
  ctx: ScrapeContext,
): Promise<ScrapedEventRecord[]> {
  const city = ctx.countryCode === "US" ? "new-york" : "online";
  const url = ctx.source.scrapeUrl || `https://www.meetup.com/find/?location=${city}`;
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  const events: ScrapedEventRecord[] = [];

  $("a[href*='/events/'], [data-event-id]").each((_, el) => {
    if (events.length >= (ctx.limit || 15)) return false;
    const node = $(el);
    const title = node.text().trim() || node.attr("aria-label") || "";
    const href = node.attr("href") || "";
    if (!title || title.length < 4) return;
    const sourceUrl = href.startsWith("http") ? href : `https://www.meetup.com${href}`;
    events.push(
      baseEvent(ctx.source, {
        title,
        description: `Meetup: ${title}`,
        startDate: "",
        city,
        countryCode: ctx.countryCode || "GL",
        sourceUrl,
        category: "community",
        tags: ["meetup", "community"],
      }),
    );
  });

  return events;
}

export async function scrapeHtmlList(
  ctx: ScrapeContext,
): Promise<ScrapedEventRecord[]> {
  if (!ctx.source.scrapeUrl) return [];
  const html = await fetchHtml(ctx.source.scrapeUrl);
  const $ = cheerio.load(html);
  const events: ScrapedEventRecord[] = [];

  $("article, .event, .event-card, li a, h2 a, h3 a").each((_, el) => {
    if (events.length >= (ctx.limit || 15)) return false;
    const node = $(el);
    const title = node.text().trim().replace(/\s+/g, " ");
    const href = node.attr("href") || node.find("a").first().attr("href") || "";
    if (!title || title.length < 6 || title.length > 180) return;
    if (/login|sign up|cookie|privacy/i.test(title)) return;
    let sourceUrl = href;
    if (href && !href.startsWith("http")) {
      const base = new URL(ctx.source.scrapeUrl!);
      sourceUrl = `${base.origin}${href.startsWith("/") ? "" : "/"}${href}`;
    }
    events.push(
      baseEvent(ctx.source, {
        title,
        description: `${title} — from ${ctx.source.name}`,
        startDate: "",
        countryCode: ctx.source.countryCode,
        city: ctx.source.country,
        sourceUrl: sourceUrl || ctx.source.scrapeUrl,
        category: "events",
        tags: [ctx.source.id, "html-list"],
      }),
    );
  });

  return dedupeByTitle(events);
}

function dedupeByTitle(events: ScrapedEventRecord[]) {
  const seen = new Set<string>();
  return events.filter((e) => {
    const key = e.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function scrapeSource(ctx: ScrapeContext): Promise<ScrapedEventRecord[]> {
  switch (ctx.source.scrapeMethod) {
    case "eventbrite-discovery":
      return scrapeEventbriteDiscovery(ctx);
    case "meetup-search":
      return scrapeMeetupSearch(ctx);
    case "html-list":
      return scrapeHtmlList(ctx);
    default:
      return [];
  }
}

export async function runScrapeJob(options?: {
  countryCode?: string;
  sourceIds?: string[];
  limitPerSource?: number;
}) {
  const { EVENT_SOURCES } = await import("@/data/event-sources");
  const { addScrapeRun, upsertScrapedEvents, newId } = await import("@/lib/db");

  const limit = options?.limitPerSource ?? 12;
  let sources = EVENT_SOURCES.filter((s) => s.scrapeMethod !== "manual");

  if (options?.countryCode) {
    sources = sources.filter(
      (s) => s.countryCode === options.countryCode || s.countryCode === "GL",
    );
  }
  if (options?.sourceIds?.length) {
    sources = sources.filter((s) => options.sourceIds!.includes(s.id));
  }

  const runId = newId("run");
  const startedAt = new Date().toISOString();
  const errors: string[] = [];
  const all: ScrapedEventRecord[] = [];

  for (const source of sources) {
    try {
      const found = await scrapeSource({
        source,
        countryCode: options?.countryCode,
        limit,
      });
      all.push(...found);
    } catch (err) {
      errors.push(`${source.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  await upsertScrapedEvents(all);
  await addScrapeRun({
    id: runId,
    startedAt,
    finishedAt: new Date().toISOString(),
    sources: sources.map((s) => s.id),
    totalFound: all.length,
    errors,
  });

  return { runId, totalFound: all.length, errors, events: all };
}
