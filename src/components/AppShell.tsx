"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

const navItems = [
  { href: "/explore", key: "explore" as const, icon: ExploreIcon },
  { href: "/map", key: "map" as const, icon: MapIcon },
  { href: "/me", key: "me" as const, icon: MeIcon },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("nav");
  const tBrand = useTranslations("brand");
  const pathname = usePathname();
  const isIdeaDetail = pathname.startsWith("/ideas/");
  const isCreateIdea = pathname.startsWith("/explore/create");
  const hideChrome = isIdeaDetail || isCreateIdea;

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col bg-supp-black text-white sm:max-w-lg">
      {!hideChrome && (
        <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-white/10 bg-black/80 px-4 backdrop-blur-md">
          <Link
            href="/explore"
            className="flex items-center gap-2 font-display text-[17px] font-extrabold tracking-tight"
          >
            <img
              src="/logo.jpg"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 rounded-sm object-cover"
            />
            {tBrand("name")}
          </Link>
          <span className="text-[11px] tracking-wide text-white/55">{tBrand("tagline")}</span>
        </header>
      )}

      <main className={`flex-1 ${hideChrome ? "" : "pb-[72px]"}`}>{children}</main>

      {!hideChrome && (
        <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-white/10 bg-[#141414] pb-[env(safe-area-inset-bottom)] sm:max-w-lg">
          <div className="grid grid-cols-3">
            {navItems.map(({ href, key, icon: Icon }) => {
              const active =
                pathname === href ||
                (href === "/explore" && pathname.startsWith("/explore"));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                    active ? "bg-supp-red text-white" : "text-white/70 hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5" active={active} />
                  {t(key)}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

function ExploreIcon({ className }: { className?: string; active?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 12.5 20 4.5l-3.2 15.2-4.1-5.4-5.2 2.1L3.5 12.5z" />
    </svg>
  );
}

function MapIcon({ className }: { className?: string; active?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M3 12h18M12 3c2.5 2.8 3.8 5.8 3.8 9s-1.3 6.2-3.8 9c-2.5-2.8-3.8-5.8-3.8-9S9.5 5.8 12 3z" />
    </svg>
  );
}

function MeIcon({ className }: { className?: string; active?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.5 14.2 9H20l-4.5 3.4 1.7 5.6L12 14.8 6.8 18l1.7-5.6L4 9h5.8L12 3.5z" />
    </svg>
  );
}
