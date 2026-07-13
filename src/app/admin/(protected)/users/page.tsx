"use client";

import { useEffect, useState } from "react";
import type { UserRecord } from "@/lib/types";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [form, setForm] = useState<Partial<UserRecord>>({
    name: "",
    nameZh: "",
    email: "",
    city: "",
    country: "",
    status: "active",
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data.users || []);
  }

  useEffect(() => { void load(); }, []);

  async function save() {
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/admin/users/${editingId}` : "/api/admin/users";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, id: editingId || undefined }),
    });
    setForm({ name: "", nameZh: "", email: "", city: "", country: "", status: "active" });
    setEditingId(null);
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Delete user?")) return;
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Users</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-[#171a21] p-4">
          <h2 className="font-semibold">{editingId ? "Edit user" : "New user"}</h2>
          <div className="mt-3 grid gap-2">
            {[
              ["name", "Name (EN)"],
              ["nameZh", "Name (ZH)"],
              ["email", "Email"],
              ["city", "City"],
              ["country", "Country"],
              ["persona", "Persona"],
            ].map(([key, label]) => (
              <label key={key} className="text-xs text-white/60">
                {label}
                <input
                  value={String(form[key as keyof UserRecord] ?? "")}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-sm"
                />
              </label>
            ))}
            <label className="text-xs text-white/60">
              Status
              <select
                value={form.status || "active"}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as UserRecord["status"] }))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-sm"
              >
                <option value="active">active</option>
                <option value="suspended">suspended</option>
              </select>
            </label>
          </div>
          <button type="button" onClick={save} className="mt-3 rounded-lg bg-supp-red px-3 py-2 text-sm font-semibold">
            {editingId ? "Update" : "Create"}
          </button>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#171a21] p-4">
          <h2 className="font-semibold">All users ({users.length})</h2>
          <ul className="mt-3 max-h-[70vh] space-y-2 overflow-y-auto">
            {users.map((u) => (
              <li key={u.id} className="rounded-xl border border-white/10 p-3">
                <div className="flex justify-between gap-2">
                  <div>
                    <p className="font-medium">{u.name} / {u.nameZh}</p>
                    <p className="text-xs text-white/50">{u.email} · {u.status}</p>
                    <p className="text-xs text-white/40">Done {u.experienced} · Saved {u.favorited}</p>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <button type="button" onClick={() => { setEditingId(u.id); setForm(u); }} className="text-sky-300">Edit</button>
                    <button type="button" onClick={() => remove(u.id)} className="text-red-300">Del</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
