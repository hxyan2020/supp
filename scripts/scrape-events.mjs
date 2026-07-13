#!/usr/bin/env node
/**
 * CLI scraper for Supp admin pipeline.
 * Usage:
 *   npm run scrape
 *   npm run scrape -- --country US --limit 5
 */
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    country: { type: "string", short: "c" },
    limit: { type: "string", short: "l" },
    base: { type: "string", default: process.env.SCRAPE_BASE_URL || "http://localhost:7502" },
    password: { type: "string", default: process.env.ADMIN_PASSWORD || "supp-admin-dev" },
  },
});

const base = values.base;
const password = values.password;

async function login() {
  const res = await fetch(`${base}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) throw new Error("Admin login failed — check ADMIN_PASSWORD and server URL");
  return res.headers.getSetCookie?.() || [];
}

async function run(cookieHeader) {
  const res = await fetch(`${base}/api/admin/scraped`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      countryCode: values.country,
      limitPerSource: Number(values.limit) || 10,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Scrape failed");
  return data;
}

try {
  const cookies = await login();
  const cookieHeader = cookies.map((c) => c.split(";")[0]).join("; ");
  const result = await run(cookieHeader);
  console.log(`Scrape complete: ${result.totalFound} events`);
  if (result.errors?.length) {
    console.log("Errors:");
    result.errors.forEach((e) => console.log(`  - ${e}`));
  }
  console.log(`Review at ${base}/admin/scraped`);
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
