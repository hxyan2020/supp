"use client";

import { useEffect, useMemo, useState } from "react";
import type { UserRecord } from "@/lib/types";
import { locales } from "@/i18n/routing";

const emptyUser = (): Partial<UserRecord> => ({
  name: "",
  nameZh: "",
  email: "",
  avatar: "/images/avatar-user.jpg",
  locale: "en",
  city: "",
  country: "",
  experienced: 0,
  favorited: 0,
  claimed: 0,
  persona: "Explorer",
  personaZh: "探索者",
  favoritedIds: [],
  experiencedIds: [],
  joinedIds: [],
  status: "active",
});

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

function idsToText(ids?: string[]) {
  return Array.isArray(ids) ? ids.join(", ") : "";
}

function textToIds(value: string) {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [form, setForm] = useState<Partial<UserRecord>>(emptyUser);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (statusFilter !== "all" && u.status !== statusFilter) return false;
      if (!q) return true;
      return [u.id, u.name, u.nameZh, u.email, u.city, u.country, u.persona]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [users, query, statusFilter]);

  function set<K extends keyof UserRecord>(key: K, value: UserRecord[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    if (!form.name?.trim() && !form.email?.trim()) {
      setMessage("Name or email is required");
      return;
    }
    setSaving(true);
    setMessage("");
    const payload = {
      ...form,
      experienced: Number(form.experienced) || 0,
      favorited: Number(form.favorited) || 0,
      claimed: Number(form.claimed) || 0,
      favoritedIds: Array.isArray(form.favoritedIds)
        ? form.favoritedIds
        : textToIds(String(form.favoritedIds || "")),
      experiencedIds: Array.isArray(form.experiencedIds)
        ? form.experiencedIds
        : textToIds(String(form.experiencedIds || "")),
      joinedIds: Array.isArray(form.joinedIds)
        ? form.joinedIds
        : textToIds(String(form.joinedIds || "")),
    };
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/admin/users/${editingId}` : "/api/admin/users";
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
    setForm(emptyUser());
    setEditingId(null);
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Delete user?")) return;
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (editingId === id) {
      setEditingId(null);
      setForm(emptyUser());
    }
    await load();
  }

  function edit(u: UserRecord) {
    setEditingId(u.id);
    setForm(u);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-white/55">
          Manage profile, locale, persona, counters, and related idea IDs
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-white/10 bg-[#171a21] p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">
              {editingId ? `Edit · ${editingId}` : "New user"}
            </h2>
            {message && <p className="text-xs text-emerald-300">{message}</p>}
          </div>

          <div className="mt-4 space-y-5">
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-white/80">Profile</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="Name (EN)">
                  <input className={inputClass} value={form.name || ""} onChange={(e) => set("name", e.target.value)} />
                </Field>
                <Field label="Name (ZH)">
                  <input className={inputClass} value={form.nameZh || ""} onChange={(e) => set("nameZh", e.target.value)} />
                </Field>
                <Field label="Email" className="sm:col-span-2">
                  <input type="email" className={inputClass} value={form.email || ""} onChange={(e) => set("email", e.target.value)} />
                </Field>
                <Field label="Avatar URL" className="sm:col-span-2">
                  <input className={inputClass} value={form.avatar || ""} onChange={(e) => set("avatar", e.target.value)} />
                </Field>
                <Field label="City">
                  <input className={inputClass} value={form.city || ""} onChange={(e) => set("city", e.target.value)} />
                </Field>
                <Field label="Country">
                  <input className={inputClass} value={form.country || ""} onChange={(e) => set("country", e.target.value)} />
                </Field>
                <Field label="Locale">
                  <select
                    className={inputClass}
                    value={form.locale || "en"}
                    onChange={(e) => set("locale", e.target.value)}
                  >
                    {locales.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Status">
                  <select
                    className={inputClass}
                    value={form.status || "active"}
                    onChange={(e) => set("status", e.target.value as UserRecord["status"])}
                  >
                    <option value="active">active</option>
                    <option value="suspended">suspended</option>
                  </select>
                </Field>
              </div>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-white/80">Persona</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="Persona (EN)">
                  <input className={inputClass} value={form.persona || ""} onChange={(e) => set("persona", e.target.value)} />
                </Field>
                <Field label="Persona (ZH)">
                  <input className={inputClass} value={form.personaZh || ""} onChange={(e) => set("personaZh", e.target.value)} />
                </Field>
              </div>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-white/80">Counters</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                <Field label="Experienced">
                  <input type="number" className={inputClass} value={form.experienced ?? 0} onChange={(e) => set("experienced", Number(e.target.value))} />
                </Field>
                <Field label="Favorited">
                  <input type="number" className={inputClass} value={form.favorited ?? 0} onChange={(e) => set("favorited", Number(e.target.value))} />
                </Field>
                <Field label="Claimed">
                  <input type="number" className={inputClass} value={form.claimed ?? 0} onChange={(e) => set("claimed", Number(e.target.value))} />
                </Field>
              </div>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-white/80">Related idea IDs</legend>
              <p className="text-[11px] text-white/40">
                Comma-separated idea IDs linked to this user (e.g. sunrise-hike, pottery-bowl)
              </p>
              <Field label="Experienced idea IDs">
                <textarea
                  className={inputClass}
                  rows={2}
                  value={idsToText(form.experiencedIds)}
                  onChange={(e) => set("experiencedIds", textToIds(e.target.value))}
                />
              </Field>
              <Field label="Favorited idea IDs">
                <textarea
                  className={inputClass}
                  rows={2}
                  value={idsToText(form.favoritedIds)}
                  onChange={(e) => set("favoritedIds", textToIds(e.target.value))}
                />
              </Field>
              <Field label="Joined idea IDs">
                <textarea
                  className={inputClass}
                  rows={2}
                  value={idsToText(form.joinedIds)}
                  onChange={(e) => set("joinedIds", textToIds(e.target.value))}
                />
              </Field>
            </fieldset>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="rounded-lg bg-supp-red px-3 py-2 text-sm font-semibold disabled:opacity-50"
            >
              {saving ? "Saving…" : editingId ? "Update user" : "Create user"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyUser());
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
          <h2 className="font-semibold">
            All users ({filtered.length}/{users.length})
          </h2>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, city…"
              className={inputClass}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className={`${inputClass} sm:w-36`}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          {loading ? (
            <p className="mt-3 text-sm text-white/50">Loading…</p>
          ) : (
            <ul className="mt-3 max-h-[80vh] space-y-2 overflow-y-auto">
              {filtered.map((u) => (
                <li key={u.id} className="rounded-xl border border-white/10 p-3">
                  <div className="flex justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {u.name} / {u.nameZh}
                      </p>
                      <p className="truncate text-xs text-white/50">
                        {u.email} · {u.status} · {u.locale}
                      </p>
                      <p className="text-[11px] text-white/40">
                        {u.city}, {u.country} · Done {u.experienced} · Saved {u.favorited} · Claimed {u.claimed}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2 text-xs">
                      <button type="button" onClick={() => edit(u)} className="text-sky-300">
                        Edit
                      </button>
                      <button type="button" onClick={() => void remove(u.id)} className="text-red-300">
                        Del
                      </button>
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
