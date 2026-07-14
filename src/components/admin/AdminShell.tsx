"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/ideas", label: "Ideas" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/scraped", label: "Scrape queue" },
  { href: "/admin/sources", label: "Sources" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <div className="min-h-screen bg-[#0f1115] text-white">
      <header className="border-b border-white/10 bg-[#12151b]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="flex items-center gap-2 text-sm font-bold tracking-wide text-supp-red"
            >
              <img
                src="/logo.jpg"
                alt=""
                width={24}
                height={24}
                className="h-6 w-6 rounded-sm object-cover"
              />
              Supp Admin
            </Link>
            <nav className="hidden gap-1 sm:flex">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-lg px-3 py-1.5 text-sm ${
                    pathname === l.href
                      ? "bg-white/10 text-white"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/70"
          >
            Logout
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
