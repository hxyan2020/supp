"use client";

import { useEffect, useState } from "react";
import type { ScrapedEventRecord } from "@/lib/types";

export default function AdminScrapedPage() {
  const [events, setEvents] = useState<ScrapedEventRecord[]>([]);
  const [countryCode, setCountryCode] = useState("");
  const [running, setRunning] = useState(false);
  const [selected, setSelected] = useState<ScrapedEventRecord | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

  async function load() {
    const res = await fetch("/api/admin/scraped?status=pending");
    const data = await res.json();
    setEvents(data.events || []);
  }

  useEffect(() => { void load(); }, []);

  async function runScraper() {
    setRunning(true);
    await fetch("/api/admin/scraped", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ countryCode: countryCode || undefined, limitPerSource: 8 }),
    });
    setRunning(false);
    await load();
  }

  async function reject(id: string) {
    await fetch("/api/admin/scraped", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, patch: { status: "rejected", reviewedAt: new Date().toISOString() } }),
    });
    await load();
    setSelected(null);
  }

  async function publish(id: string) {
    await fetch(`/api/admin/scraped/${id}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTitle,
        description: editDesc,
        published: true,
      }),
    });
    await load();
    setSelected(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Scrape queue</h1>
          <p className="text-sm text-white/55">Review scraped events before publishing to Supp</p>
        </div>
        <div className="flex gap-2">
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
          >
            <option value="">All countries</option>
            {["US","CN","JP","IN","GB","DE","FR","BR","KR","AU","SG","ID","TH"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={runScraper}
            disabled={running}
            className="rounded-lg bg-supp-red px-4 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {running ? "Scraping…" : "Run scraper"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ul className="max-h-[75vh] space-y-2 overflow-y-auto rounded-2xl border border-white/10 bg-[#171a21] p-3">
          {events.length === 0 ? (
            <li className="p-4 text-sm text-white/50">No pending scraped events. Run the scraper.</li>
          ) : (
            events.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => { setSelected(e); setEditTitle(e.title); setEditDesc(e.description); }}
                  className={`w-full rounded-xl border p-3 text-left ${selected?.id === e.id ? "border-supp-red bg-white/5" : "border-white/10"}`}
                >
                  <p className="font-medium">{e.title}</p>
                  <p className="mt-1 text-xs text-white/50">{e.sourceName} · {e.country} · {e.city}</p>
                  <p className="mt-1 truncate text-xs text-white/40">{e.sourceUrl}</p>
                </button>
              </li>
            ))
          )}
        </ul>

        <section className="rounded-2xl border border-white/10 bg-[#171a21] p-4">
          {selected ? (
            <>
              <h2 className="font-semibold">Review & publish</h2>
              <p className="mt-1 text-xs text-white/50">Source: {selected.sourceName}</p>
              <label className="mt-3 block text-xs text-white/60">
                Title
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
              <label className="mt-2 block text-xs text-white/60">
                Description
                <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={6} className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-sm" />
              </label>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => publish(selected.id)} className="rounded-lg bg-supp-red px-3 py-2 text-sm font-semibold">
                  Publish to Supp
                </button>
                <button type="button" onClick={() => reject(selected.id)} className="rounded-lg border border-white/15 px-3 py-2 text-sm">
                  Reject
                </button>
                <a href={selected.sourceUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-white/15 px-3 py-2 text-sm">
                  Open source
                </a>
              </div>
            </>
          ) : (
            <p className="text-sm text-white/50">Select a scraped event to review.</p>
          )}
        </section>
      </div>
    </div>
  );
}
