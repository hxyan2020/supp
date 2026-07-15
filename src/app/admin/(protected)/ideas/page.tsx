"use client";

import { useEffect, useMemo, useState } from "react";
import type { IdeaRecord } from "@/lib/types";
import type { Category, Sensation, SocialPlatform } from "@/data/mock-ideas";

const CATEGORIES: Category[] = [
  "comfort",
  "taste",
  "outdoors",
  "creative",
  "social",
  "culture",
  "adrenaline",
  "wellness",
];

const SENSATIONS: Sensation[] = ["calm", "curious", "stimulating", "intense"];
const WEATHERS: IdeaRecord["weather"][] = ["any", "sunny", "cloudy", "rainy"];
const SOCIAL_PLATFORMS: SocialPlatform[] = ["tiktok", "instagram", "xiaohongshu"];

function linesValue(value?: string[]) {
  return (value || []).join("\n");
}

function parseLines(value: string) {
  return value.split(/\r?\n/);
}

const emptyIdea = (): Partial<IdeaRecord> => ({
  title: "",
  titleZh: "",
  summary: "",
  summaryZh: "",
  description: "",
  descriptionZh: "",
  tip: "",
  tipZh: "",
  location: "",
  locationZh: "",
  address: "",
  addressZh: "",
  lat: 22.28,
  lng: 114.16,
  date: "",
  startsAt: "",
  endsAt: "",
  durationMin: 60,
  fee: 0,
  weather: "any",
  city: "Hong Kong",
  country: "China",
  categories: ["social"],
  sensation: "curious",
  image: "/images/event-park.jpg",
  organizer: "Supp",
  organizerZh: "嘛呢",
  organizerAvatar: "/avatars/default.svg",
  experiencedCount: 0,
  favoritedCount: 0,
  participantCount: 0,
  maxParticipants: 20,
  relevance: 80,
  tags: [],
  steps: [],
  stepsZh: [],
  needs: [],
  needsZh: [],
  socialEmbeds: [],
  published: true,
  sourceUrl: "",
  sourcePlatform: "",
});

function toLocalInput(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string) {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`text-xs text-white/60 ${className}`}>
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-sm text-white outline-none focus:border-supp-red";

export default function AdminIdeasPage() {
  const [ideas, setIdeas] = useState<IdeaRecord[]>([]);
  const [form, setForm] = useState<Partial<IdeaRecord>>(emptyIdea);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<
    "all" | "published" | "draft" | "rejected"
  >("all");
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/ideas");
    const data = await res.json();
    setIdeas(data.ideas || []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  function statusOf(idea: IdeaRecord) {
    return (
      idea.creationStatus || (idea.published ? "published" : "draft")
    );
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ideas.filter((idea) => {
      const status = statusOf(idea);
      if (filter !== "all" && status !== filter) return false;
      if (!q) return true;
      return [
        idea.id,
        idea.title,
        idea.titleZh,
        idea.city,
        idea.country,
        idea.creatorName,
        idea.creatorUserId,
        ...(idea.tags || []),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [ideas, query, filter]);

  function set<K extends keyof IdeaRecord>(key: K, value: IdeaRecord[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    if (!form.title?.trim()) {
      setMessage("Title is required");
      return;
    }
    setSaving(true);
    setMessage("");
    const payload = {
      ...form,
      startsAt: fromLocalInput(String(form.startsAt || "")) || form.startsAt,
      endsAt: fromLocalInput(String(form.endsAt || "")) || form.endsAt,
      tags: Array.isArray(form.tags)
        ? form.tags
        : String(form.tags || "")
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
      categories: form.categories?.length ? form.categories : ["social"],
      steps: (form.steps || []).map((s) => s.trim()).filter(Boolean),
      stepsZh: (form.stepsZh || []).map((s) => s.trim()).filter(Boolean),
      needs: (form.needs || []).map((s) => s.trim()).filter(Boolean),
      needsZh: (form.needsZh || []).map((s) => s.trim()).filter(Boolean),
      socialEmbeds: (form.socialEmbeds || []).filter(
        (e) => e?.platform && e?.url?.trim(),
      ),
      lat: Number(form.lat) || 0,
      lng: Number(form.lng) || 0,
      durationMin: Number(form.durationMin) || 60,
      fee: Number(form.fee) || 0,
      experiencedCount: Number(form.experiencedCount) || 0,
      favoritedCount: Number(form.favoritedCount) || 0,
      participantCount: Number(form.participantCount) || 0,
      maxParticipants: Number(form.maxParticipants) || 20,
      relevance: Number(form.relevance) || 70,
    };
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/admin/ideas/${editingId}` : "/api/admin/ideas";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, id: editingId || undefined }),
    });
    setSaving(false);
    if (!res.ok) {
      setMessage("Save failed");
      return;
    }
    setMessage(editingId ? "Updated" : "Created");
    setForm(emptyIdea());
    setEditingId(null);
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this idea?")) return;
    await fetch(`/api/admin/ideas/${id}`, { method: "DELETE" });
    if (editingId === id) {
      setEditingId(null);
      setForm(emptyIdea());
    }
    await load();
  }

  function edit(idea: IdeaRecord) {
    setEditingId(idea.id);
    setForm({
      ...idea,
      steps: idea.steps || [],
      stepsZh: idea.stepsZh || [],
      needs: idea.needs || [],
      needsZh: idea.needsZh || [],
      socialEmbeds: idea.socialEmbeds || [],
      startsAt: toLocalInput(idea.startsAt),
      endsAt: toLocalInput(idea.endsAt),
    });
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleCategory(cat: Category) {
    const current = form.categories || [];
    set(
      "categories",
      current.includes(cat)
        ? current.filter((c) => c !== cat)
        : [...current, cat],
    );
  }

  function updateEmbed(
    index: number,
    patch: Partial<NonNullable<IdeaRecord["socialEmbeds"]>[number]>,
  ) {
    const list = [...(form.socialEmbeds || [])];
    list[index] = { ...list[index], ...patch };
    set("socialEmbeds", list);
  }

  function addEmbed() {
    set("socialEmbeds", [
      ...(form.socialEmbeds || []),
      { platform: "tiktok", url: "", title: "", titleZh: "" },
    ]);
  }

  function removeEmbed(index: number) {
    set(
      "socialEmbeds",
      (form.socialEmbeds || []).filter((_, i) => i !== index),
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ideas</h1>
        <p className="text-sm text-white/55">
          Manage ideas — unfinished drafts, rejected (screening), and published. Shows creator.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-white/10 bg-[#171a21] p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">
              {editingId ? `Edit · ${editingId}` : "New idea"}
            </h2>
            {message && <p className="text-xs text-emerald-300">{message}</p>}
          </div>

          <div className="mt-4 space-y-5">
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-white/80">Copy</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="Title (EN)">
                  <input className={inputClass} value={form.title || ""} onChange={(e) => set("title", e.target.value)} />
                </Field>
                <Field label="Title (ZH)">
                  <input className={inputClass} value={form.titleZh || ""} onChange={(e) => set("titleZh", e.target.value)} />
                </Field>
                <Field label="Summary (EN)">
                  <input className={inputClass} value={form.summary || ""} onChange={(e) => set("summary", e.target.value)} />
                </Field>
                <Field label="Summary (ZH)">
                  <input className={inputClass} value={form.summaryZh || ""} onChange={(e) => set("summaryZh", e.target.value)} />
                </Field>
              </div>
              <Field label="Description (EN)">
                <textarea className={inputClass} rows={3} value={form.description || ""} onChange={(e) => set("description", e.target.value)} />
              </Field>
              <Field label="Description (ZH)">
                <textarea className={inputClass} rows={3} value={form.descriptionZh || ""} onChange={(e) => set("descriptionZh", e.target.value)} />
              </Field>
              <Field label="Tip (EN)">
                <textarea className={inputClass} rows={2} value={form.tip || ""} onChange={(e) => set("tip", e.target.value)} />
              </Field>
              <Field label="Tip (ZH)">
                <textarea className={inputClass} rows={2} value={form.tipZh || ""} onChange={(e) => set("tipZh", e.target.value)} />
              </Field>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-white/80">Steps / What you need</legend>
              <p className="text-[11px] text-white/45">One item per line. Leave blank if not needed.</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="Steps (EN)">
                  <textarea
                    className={inputClass}
                    rows={4}
                    value={linesValue(form.steps)}
                    onChange={(e) => set("steps", parseLines(e.target.value))}
                    placeholder={"Step 1\nStep 2"}
                  />
                </Field>
                <Field label="Steps (ZH)">
                  <textarea
                    className={inputClass}
                    rows={4}
                    value={linesValue(form.stepsZh)}
                    onChange={(e) => set("stepsZh", parseLines(e.target.value))}
                  />
                </Field>
                <Field label="What you need (EN)">
                  <textarea
                    className={inputClass}
                    rows={3}
                    value={linesValue(form.needs)}
                    onChange={(e) => set("needs", parseLines(e.target.value))}
                    placeholder={"Headphones\nPhone"}
                  />
                </Field>
                <Field label="What you need (ZH)">
                  <textarea
                    className={inputClass}
                    rows={3}
                    value={linesValue(form.needsZh)}
                    onChange={(e) => set("needsZh", parseLines(e.target.value))}
                  />
                </Field>
              </div>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-white/80">Social media embeds</legend>
              <p className="text-[11px] text-white/45">
                Optional TikTok / Instagram / Xiaohongshu video links for the idea detail page.
              </p>
              <div className="space-y-3">
                {(form.socialEmbeds || []).map((embed, index) => (
                  <div
                    key={`embed-${index}`}
                    className="rounded-xl border border-white/10 bg-black/20 p-3"
                  >
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Field label="Platform">
                        <select
                          className={inputClass}
                          value={embed.platform}
                          onChange={(e) =>
                            updateEmbed(index, {
                              platform: e.target.value as SocialPlatform,
                            })
                          }
                        >
                          {SOCIAL_PLATFORMS.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="URL">
                        <input
                          className={inputClass}
                          value={embed.url || ""}
                          onChange={(e) => updateEmbed(index, { url: e.target.value })}
                          placeholder="https://…"
                        />
                      </Field>
                      <Field label="Title (EN)">
                        <input
                          className={inputClass}
                          value={embed.title || ""}
                          onChange={(e) => updateEmbed(index, { title: e.target.value })}
                        />
                      </Field>
                      <Field label="Title (ZH)">
                        <input
                          className={inputClass}
                          value={embed.titleZh || ""}
                          onChange={(e) => updateEmbed(index, { titleZh: e.target.value })}
                        />
                      </Field>
                      <Field label="Embed URL (optional)" className="sm:col-span-2">
                        <input
                          className={inputClass}
                          value={embed.embedUrl || ""}
                          onChange={(e) => updateEmbed(index, { embedUrl: e.target.value })}
                        />
                      </Field>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEmbed(index)}
                      className="mt-2 text-xs text-red-300"
                    >
                      Remove embed
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addEmbed}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/80"
              >
                + Add social embed
              </button>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-white/80">Place</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="Location (EN)">
                  <input className={inputClass} value={form.location || ""} onChange={(e) => set("location", e.target.value)} />
                </Field>
                <Field label="Location (ZH)">
                  <input className={inputClass} value={form.locationZh || ""} onChange={(e) => set("locationZh", e.target.value)} />
                </Field>
                <Field label="Address (EN)">
                  <input className={inputClass} value={form.address || ""} onChange={(e) => set("address", e.target.value)} />
                </Field>
                <Field label="Address (ZH)">
                  <input className={inputClass} value={form.addressZh || ""} onChange={(e) => set("addressZh", e.target.value)} />
                </Field>
                <Field label="City">
                  <input className={inputClass} value={form.city || ""} onChange={(e) => set("city", e.target.value)} />
                </Field>
                <Field label="Country">
                  <input className={inputClass} value={form.country || ""} onChange={(e) => set("country", e.target.value)} />
                </Field>
                <Field label="Latitude">
                  <input type="number" step="any" className={inputClass} value={form.lat ?? 0} onChange={(e) => set("lat", Number(e.target.value))} />
                </Field>
                <Field label="Longitude">
                  <input type="number" step="any" className={inputClass} value={form.lng ?? 0} onChange={(e) => set("lng", Number(e.target.value))} />
                </Field>
              </div>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-white/80">Schedule & pricing</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="Date display">
                  <input className={inputClass} value={form.date || ""} onChange={(e) => set("date", e.target.value)} placeholder="Sat · 5:30 AM" />
                </Field>
                <Field label="Duration (minutes)">
                  <input type="number" className={inputClass} value={form.durationMin ?? 60} onChange={(e) => set("durationMin", Number(e.target.value))} />
                </Field>
                <Field label="Starts at">
                  <input type="datetime-local" className={inputClass} value={String(form.startsAt || "")} onChange={(e) => set("startsAt", e.target.value)} />
                </Field>
                <Field label="Ends at">
                  <input type="datetime-local" className={inputClass} value={String(form.endsAt || "")} onChange={(e) => set("endsAt", e.target.value)} />
                </Field>
                <Field label="Fee (HKD)">
                  <input type="number" className={inputClass} value={form.fee ?? 0} onChange={(e) => set("fee", Number(e.target.value))} />
                </Field>
                <Field label="Weather">
                  <select className={inputClass} value={form.weather || "any"} onChange={(e) => set("weather", e.target.value as IdeaRecord["weather"])}>
                    {WEATHERS.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-white/80">Classification</legend>
              <Field label="Sensation">
                <select className={inputClass} value={form.sensation || "curious"} onChange={(e) => set("sensation", e.target.value as Sensation)}>
                  {SENSATIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <div>
                <p className="text-xs text-white/60">Categories</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => {
                    const on = form.categories?.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={`rounded-full px-2.5 py-1 text-xs ${
                          on ? "bg-supp-red text-white" : "bg-white/10 text-white/70"
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>
              <Field label="Tags (comma-separated)">
                <input
                  className={inputClass}
                  value={Array.isArray(form.tags) ? form.tags.join(", ") : ""}
                  onChange={(e) =>
                    set(
                      "tags",
                      e.target.value
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean),
                    )
                  }
                />
              </Field>
              <Field label="Relevance (0–100)">
                <input type="number" min={0} max={100} className={inputClass} value={form.relevance ?? 80} onChange={(e) => set("relevance", Number(e.target.value))} />
              </Field>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-white/80">Media & organizer</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="Image URL" className="sm:col-span-2">
                  <input className={inputClass} value={form.image || ""} onChange={(e) => set("image", e.target.value)} />
                </Field>
                <Field label="Organizer (EN)">
                  <input className={inputClass} value={form.organizer || ""} onChange={(e) => set("organizer", e.target.value)} />
                </Field>
                <Field label="Organizer (ZH)">
                  <input className={inputClass} value={form.organizerZh || ""} onChange={(e) => set("organizerZh", e.target.value)} />
                </Field>
                <Field label="Organizer avatar URL" className="sm:col-span-2">
                  <input className={inputClass} value={form.organizerAvatar || ""} onChange={(e) => set("organizerAvatar", e.target.value)} />
                </Field>
              </div>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-white/80">Stats & capacity</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="Experienced count">
                  <input type="number" className={inputClass} value={form.experiencedCount ?? 0} onChange={(e) => set("experiencedCount", Number(e.target.value))} />
                </Field>
                <Field label="Favorited count">
                  <input type="number" className={inputClass} value={form.favoritedCount ?? 0} onChange={(e) => set("favoritedCount", Number(e.target.value))} />
                </Field>
                <Field label="Participant count">
                  <input type="number" className={inputClass} value={form.participantCount ?? 0} onChange={(e) => set("participantCount", Number(e.target.value))} />
                </Field>
                <Field label="Max participants">
                  <input type="number" className={inputClass} value={form.maxParticipants ?? 20} onChange={(e) => set("maxParticipants", Number(e.target.value))} />
                </Field>
              </div>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-white/80">Publishing & source</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="Source URL">
                  <input className={inputClass} value={form.sourceUrl || ""} onChange={(e) => set("sourceUrl", e.target.value)} />
                </Field>
                <Field label="Source platform">
                  <input className={inputClass} value={form.sourcePlatform || ""} onChange={(e) => set("sourcePlatform", e.target.value)} />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-sm text-white/80">
                <input
                  type="checkbox"
                  checked={form.published ?? true}
                  onChange={(e) => set("published", e.target.checked)}
                />
                Published (visible on Explore / Map)
              </label>
            </fieldset>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="rounded-lg bg-supp-red px-3 py-2 text-sm font-semibold disabled:opacity-50"
            >
              {saving ? "Saving…" : editingId ? "Update idea" : "Create idea"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyIdea());
                  setMessage("");
                }}
                className="rounded-lg border border-white/15 px-3 py-2 text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#171a21] p-4">
          <h2 className="font-semibold">All ideas ({filtered.length}/{ideas.length})</h2>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, city, tags…"
              className={inputClass}
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className={`${inputClass} sm:w-40`}
            >
              <option value="all">All</option>
              <option value="published">Published</option>
              <option value="draft">Unfinished (draft)</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          {loading ? (
            <p className="mt-3 text-sm text-white/50">Loading…</p>
          ) : (
            <ul className="mt-3 max-h-[80vh] space-y-2 overflow-y-auto">
              {filtered.map((idea) => {
                const status = statusOf(idea);
                return (
                <li key={idea.id} className="rounded-xl border border-white/10 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{idea.title}</p>
                      <p className="text-xs text-white/50">
                        {idea.city}, {idea.country} · {status}
                      </p>
                      <p className="text-[11px] text-white/40">
                        by {idea.creatorName || idea.organizer || "—"}
                        {idea.creatorUserId ? ` · ${idea.creatorUserId}` : ""}
                      </p>
                      {status === "rejected" && idea.rejectionReason && (
                        <p className="mt-1 text-[11px] text-red-300/90">
                          {idea.rejectionReason}
                        </p>
                      )}
                      <p className="text-[11px] text-white/40">
                        fee {idea.fee} · {idea.durationMin}m · exp {idea.experiencedCount}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button type="button" onClick={() => edit(idea)} className="text-xs text-sky-300">
                        Edit
                      </button>
                      <button type="button" onClick={() => void remove(idea.id)} className="text-xs text-red-300">
                        Del
                      </button>
                    </div>
                  </div>
                </li>
              );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
