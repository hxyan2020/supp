"use client";

import { useEffect, useState } from "react";
import type { EventSource } from "@/lib/types";

type Economy = { rank: number; country: string; code: string; gdpBn: number };

export default function AdminSourcesPage() {
  const [economies, setEconomies] = useState<Economy[]>([]);
  const [sources, setSources] = useState<EventSource[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    void fetch("/api/admin/sources")
      .then((r) => r.json())
      .then((d) => {
        setEconomies(d.economies || []);
        setSources(d.sources || []);
      });
  }, []);

  const filtered = sources.filter(
    (s) =>
      !filter ||
      s.countryCode === filter ||
      s.country.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Event sources — Top 30 economies</h1>
        <p className="text-sm text-white/55">
          Advisory list of leading event publication platforms per country. Scrapeable sources are used by the scraper; manual sources need partner APIs or hand curation.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#171a21]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-white/10 text-white/50">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Economy</th>
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">GDP ($B)</th>
              <th className="px-3 py-2">Primary platforms</th>
            </tr>
          </thead>
          <tbody>
            {economies.map((e) => {
              const countrySources = sources.filter((s) => s.countryCode === e.code || (e.code === "US" && s.countryCode === "GL"));
              const names = countrySources.slice(0, 3).map((s) => s.name).join(", ") || "Eventbrite, Meetup, AllEvents";
              return (
                <tr key={e.code} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-3 py-2">{e.rank}</td>
                  <td className="px-3 py-2 font-medium">{e.country}</td>
                  <td className="px-3 py-2">{e.code}</td>
                  <td className="px-3 py-2">{e.gdpBn.toLocaleString()}</td>
                  <td className="px-3 py-2 text-white/70">{names}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by country code or name…"
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
        />
        <span className="text-xs text-white/40">{filtered.length} sources</span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((s) => (
          <article key={s.id} className="rounded-xl border border-white/10 bg-[#171a21] p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold">{s.name}</h3>
                <p className="text-xs text-white/50">{s.country} ({s.countryCode}) · {s.type}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] ${s.scrapeMethod === "manual" ? "bg-amber-500/20 text-amber-200" : "bg-emerald-500/20 text-emerald-200"}`}>
                {s.scrapeMethod}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-white/65">{s.notes}</p>
            <a href={s.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-sky-300">
              {s.url}
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}
