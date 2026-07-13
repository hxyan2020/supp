import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { readDb } from "@/lib/db";

export default async function AdminDashboardPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const db = await readDb();
  const pending = db.scrapedEvents.filter((e) => e.status === "pending").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-white/55">Manage Supp content and ingestion pipeline</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Published ideas" value={db.ideas.filter((i) => i.published).length} href="/admin/ideas" />
        <StatCard label="Users" value={db.users.length} href="/admin/users" />
        <StatCard label="Scrape queue" value={pending} href="/admin/scraped" />
        <StatCard label="Sources tracked" value={52} href="/admin/sources" />
      </div>

      <section className="rounded-2xl border border-white/10 bg-[#171a21] p-4">
        <h2 className="font-semibold">Last scrape run</h2>
        {db.scrapeRuns[0] ? (
          <div className="mt-2 space-y-1 text-sm text-white/70">
            <p>Found: {db.scrapeRuns[0].totalFound} events</p>
            <p>Sources: {db.scrapeRuns[0].sources.length}</p>
            <p>Started: {new Date(db.scrapeRuns[0].startedAt).toLocaleString()}</p>
            {db.scrapeRuns[0].errors.length > 0 && (
              <p className="text-amber-300">Errors: {db.scrapeRuns[0].errors.join("; ")}</p>
            )}
          </div>
        ) : (
          <p className="mt-2 text-sm text-white/50">No scrape runs yet. Go to Scrape queue.</p>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-white/10 bg-[#171a21] p-4 transition hover:border-supp-red/40"
    >
      <p className="text-3xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-white/55">{label}</p>
    </Link>
  );
}
