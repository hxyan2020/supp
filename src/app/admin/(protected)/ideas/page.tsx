"use client";

import { useEffect, useState } from "react";
import type { IdeaRecord } from "@/lib/types";

const empty: Partial<IdeaRecord> = {
  title: "",
  titleZh: "",
  summary: "",
  summaryZh: "",
  description: "",
  descriptionZh: "",
  city: "Hong Kong",
  country: "China",
  published: true,
  relevance: 80,
  fee: 0,
  durationMin: 60,
  categories: ["social"],
  sensation: "curious",
  image: "/images/event-park.jpg",
};

export default function AdminIdeasPage() {
  const [ideas, setIdeas] = useState<IdeaRecord[]>([]);
  const [form, setForm] = useState<Partial<IdeaRecord>>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  async function save() {
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/admin/ideas/${editingId}` : "/api/admin/ideas";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, id: editingId || undefined }),
    });
    setForm(empty);
    setEditingId(null);
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this idea?")) return;
    await fetch(`/api/admin/ideas/${id}`, { method: "DELETE" });
    await load();
  }

  function edit(idea: IdeaRecord) {
    setEditingId(idea.id);
    setForm(idea);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ideas</h1>
        <p className="text-sm text-white/55">Create, edit, publish experience ideas</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-[#171a21] p-4">
          <h2 className="font-semibold">{editingId ? "Edit idea" : "New idea"}</h2>
          <div className="mt-3 grid gap-2">
            {[
              ["title", "Title (EN)"],
              ["titleZh", "Title (ZH)"],
              ["summary", "Summary (EN)"],
              ["city", "City"],
              ["country", "Country"],
              ["date", "Date display"],
              ["image", "Image URL"],
              ["sourceUrl", "Source URL"],
            ].map(([key, label]) => (
              <label key={key} className="text-xs text-white/60">
                {label}
                <input
                  value={String(form[key as keyof IdeaRecord] ?? "")}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-sm text-white"
                />
              </label>
            ))}
            <label className="text-xs text-white/60">
              Description
              <textarea
                value={form.description || ""}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value, descriptionZh: e.target.value }))}
                rows={4}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-sm text-white"
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.published ?? true}
                onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
              />
              Published
            </label>
          </div>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={save} className="rounded-lg bg-supp-red px-3 py-2 text-sm font-semibold">
              {editingId ? "Update" : "Create"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => { setEditingId(null); setForm(empty); }}
                className="rounded-lg border border-white/15 px-3 py-2 text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#171a21] p-4">
          <h2 className="font-semibold">All ideas ({ideas.length})</h2>
          {loading ? (
            <p className="mt-3 text-sm text-white/50">Loading…</p>
          ) : (
            <ul className="mt-3 max-h-[70vh] space-y-2 overflow-y-auto">
              {ideas.map((idea) => (
                <li key={idea.id} className="rounded-xl border border-white/10 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{idea.title}</p>
                      <p className="text-xs text-white/50">{idea.city} · {idea.published ? "published" : "draft"}</p>
                    </div>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => edit(idea)} className="text-xs text-sky-300">Edit</button>
                      <button type="button" onClick={() => remove(idea.id)} className="text-xs text-red-300">Del</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
