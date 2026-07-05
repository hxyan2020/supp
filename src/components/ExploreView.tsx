"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { IdeaCard } from "@/components/IdeaCard";
import { searchIdeas } from "@/data/mock-ideas";

export function ExploreView() {
  const t = useTranslations("explore");
  const [query, setQuery] = useState("");
  const ideas = searchIdeas(query);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-1 text-stone-600">{t("subtitle")}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-xl border border-stone-200 bg-white py-3 ps-10 pe-4 text-sm text-stone-900 outline-none ring-emerald-500 placeholder:text-stone-400 focus:ring-2"
          />
        </div>
        <button
          type="button"
          className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
        >
          {t("filters")}
        </button>
      </div>

      <p className="text-sm text-stone-500">{t("results", { count: ideas.length })}</p>

      {ideas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center text-stone-500">
          {t("empty")}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      )}
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}
