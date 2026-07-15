"use client";

import { useEffect, useMemo, useState } from "react";
import type { UserRecord } from "@/lib/types";
import { locales } from "@/i18n/routing";

const emptyUser = (): Partial<UserRecord> & { password?: string } => ({
  name: "",
  nameZh: "",
  email: "",
  username: "",
  password: "",
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

type AdminUser = UserRecord & { hasPassword?: boolean; password?: string };

type DummyCredential = {
  index: number;
  id: string;
  username: string;
  password: string;
  email: string;
  nickname: string;
};

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
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [form, setForm] = useState<Partial<AdminUser>>(emptyUser);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");
  const [message, setMessage] = useState("");
  const [credentials, setCredentials] = useState<DummyCredential[]>([]);
  const [showCreds, setShowCreds] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }

  async function loadCredentials() {
    const res = await fetch("/api/admin/users/seed-dummies");
    const data = await res.json();
    setCredentials(data.credentials || []);
  }

  useEffect(() => {
    void load();
    void loadCredentials();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (statusFilter !== "all" && u.status !== statusFilter) return false;
      if (!q) return true;
      return [u.id, u.name, u.nameZh, u.email, u.username, u.city, u.country, u.persona]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [users, query, statusFilter]);

  function set<K extends keyof AdminUser>(key: K, value: AdminUser[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function seedDummies() {
    setSeeding(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/users/seed-dummies", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Seed failed");
      setCredentials(data.credentials || []);
      setShowCreds(true);
      setMessage(
        `Seeded dummy users · created ${data.created}, refreshed ${data.refreshed}, total ${data.total}`,
      );
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Seed failed");
    } finally {
      setSeeding(false);
    }
  }

  function downloadCredentials() {
    const blob = new Blob([JSON.stringify({ credentials }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "supp-dummy-credentials.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function save() {
    if (!form.name?.trim() && !form.email?.trim() && !form.username?.trim()) {
      setMessage("Name, username, or email is required");
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
      password: form.password?.trim() || undefined,
    };
    delete (payload as { hasPassword?: boolean }).hasPassword;
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

  function edit(u: AdminUser) {
    setEditingId(u.id);
    setForm({ ...u, password: "" });
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-white/55">
            Manage login credentials, profile, locale, persona, and idea links
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void seedDummies()}
            disabled={seeding}
            className="rounded-lg bg-supp-red px-3 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {seeding ? "Seeding…" : "Seed 120 dummy users"}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowCreds((v) => !v);
              if (!credentials.length) void loadCredentials();
            }}
            className="rounded-lg border border-white/15 px-3 py-2 text-sm"
          >
            {showCreds ? "Hide credentials" : "Show dummy credentials"}
          </button>
          {credentials.length > 0 && (
            <button
              type="button"
              onClick={downloadCredentials}
              className="rounded-lg border border-white/15 px-3 py-2 text-sm"
            >
              Download JSON
            </button>
          )}
        </div>
      </div>

      {showCreds && (
        <section className="rounded-2xl border border-white/10 bg-[#171a21] p-4">
          <h2 className="font-semibold">Dummy login credentials</h2>
          <p className="mt-1 text-xs text-white/50">
            Pattern: username <code className="text-white/80">demo001…demo120</code>, password{" "}
            <code className="text-white/80">Demo001!…Demo120!</code>
          </p>
          {credentials.length === 0 ? (
            <p className="mt-3 text-sm text-white/50">
              No credentials file yet — click “Seed 120 dummy users”.
            </p>
          ) : (
            <div className="mt-3 max-h-64 overflow-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-[#1f2430] text-white/60">
                  <tr>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Username</th>
                    <th className="px-3 py-2">Password</th>
                    <th className="px-3 py-2">Nickname</th>
                    <th className="px-3 py-2">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {credentials.map((c) => (
                    <tr key={c.username} className="border-t border-white/5">
                      <td className="px-3 py-1.5 text-white/40">{c.index}</td>
                      <td className="px-3 py-1.5 font-mono text-emerald-300">{c.username}</td>
                      <td className="px-3 py-1.5 font-mono text-amber-200">{c.password}</td>
                      <td className="px-3 py-1.5">{c.nickname}</td>
                      <td className="px-3 py-1.5 text-white/55">{c.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

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
              <legend className="text-sm font-medium text-white/80">Login</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="Username">
                  <input
                    className={inputClass}
                    value={form.username || ""}
                    onChange={(e) => set("username", e.target.value)}
                    autoComplete="off"
                  />
                </Field>
                <Field label={editingId ? "Password (leave blank to keep)" : "Password"}>
                  <input
                    type="text"
                    className={inputClass}
                    value={form.password || ""}
                    onChange={(e) => set("password", e.target.value)}
                    autoComplete="new-password"
                    placeholder={form.hasPassword ? "••••••••" : ""}
                  />
                </Field>
              </div>
            </fieldset>

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
              placeholder="Search username, name, email…"
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
                        {u.username ? (
                          <span className="font-mono text-emerald-300/90">{u.username}</span>
                        ) : (
                          "no username"
                        )}
                        {" · "}
                        {u.email || "no email"} · {u.status}
                        {u.hasPassword ? " · password" : ""}
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
