"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Invalid password");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f1115] px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#171a21] p-6"
      >
        <h1 className="flex items-center gap-2.5 text-xl font-bold">
          <img
            src="/logo.jpg"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 rounded-sm object-cover"
          />
          Supp Admin
        </h1>
        <p className="mt-1 text-sm text-white/55">
          Manage ideas, users, and scraped events
        </p>
        <label className="mt-6 block text-sm text-white/70">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 outline-none ring-supp-red focus:ring-2"
          />
        </label>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full rounded-xl bg-supp-red py-2.5 text-sm font-semibold disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
        <p className="mt-4 text-xs text-white/40">
          Default dev password: <code>supp-admin-dev</code> (set ADMIN_PASSWORD in production)
        </p>
      </form>
    </div>
  );
}
