"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { CurrencySwitcher } from "@/components/CurrencySwitcher";
import {
  getIdeaById,
  localizedIdea,
  mockFriends,
  mockUser,
} from "@/data/mock-ideas";

export function MeView() {
  const t = useTranslations("me");
  const locale = useLocale();
  const zh = locale === "zh";
  const [settingsOpen, setSettingsOpen] = useState(false);

  const favorited = mockUser.favoritedIds
    .map(getIdeaById)
    .filter(Boolean)
    .slice(0, 6);
  const joined = mockUser.joinedIds.map(getIdeaById).filter(Boolean);

  useEffect(() => {
    if (!settingsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSettingsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [settingsOpen]);

  return (
    <div className="min-h-full bg-[#f5f5f5] text-supp-ink">
      <section className="relative overflow-hidden bg-black text-white">
        <Image
          src="/images/me-bg.jpg"
          alt=""
          fill
          className="object-cover opacity-45"
          sizes="500px"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/55 to-black/80" />

        <div className="relative z-10 space-y-5 px-4 pb-6 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-white/70">
                <Image src={mockUser.avatar} alt="" fill className="object-cover" sizes="56px" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-base font-semibold">
                    {zh ? mockUser.nameZh : mockUser.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSettingsOpen(true)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20"
                    aria-label={t("settings")}
                  >
                    <SettingsIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-[11px] text-white/65">{t("editProfile")}</p>
              </div>
            </div>
            <div className="flex gap-4 text-center text-xs">
              <Stat value={mockUser.experienced} label={t("experienced")} />
              <Stat value={mockUser.favorited} label={t("favorited")} />
              <Stat value={mockUser.claimed} label={t("claimed")} />
            </div>
          </div>

          <div className="space-y-1 text-sm leading-relaxed text-white/90">
            <p>{t("summaryLead")}</p>
            <p>
              {t("summaryExperienced", { count: mockUser.experienced })}
            </p>
            <p>{t("summarySaved", { count: 4 })}</p>
            <p>
              {t("summaryPercentile", { pct: mockUser.percentile })}
            </p>
            <p className="pt-1 text-white/75">{t("summaryQuote")}</p>
          </div>
        </div>
      </section>

      <button
        type="button"
        className="relative mx-4 -mt-3 flex items-center gap-3 overflow-hidden rounded-xl bg-supp-red px-3 py-3 text-left text-white shadow-lg"
      >
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
          <Image src="/images/soul-dog.jpg" alt="" fill className="object-cover" sizes="48px" />
        </div>
        <span className="text-sm font-semibold leading-snug">{t("soulReport")}</span>
      </button>

      <section className="mx-4 mt-4 rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-14 overflow-hidden rounded-full bg-supp-soft">
            <Image src="/images/persona.png" alt="" fill className="object-cover" sizes="56px" />
          </div>
          <div>
            <p className="text-sm font-semibold">
              {t("personaTitle", {
                persona: zh ? mockUser.personaZh : mockUser.persona,
              })}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-supp-muted">
              {zh ? mockUser.personaDescZh : mockUser.personaDesc}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-4 mt-4 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold">{t("joinedTitle")}</h2>
        <p className="mt-1 text-[11px] text-supp-muted">{t("joinedHint")}</p>
        <div className="mt-3 space-y-3">
          {joined.map((idea) => {
            if (!idea) return null;
            const L = localizedIdea(idea, locale);
            return (
              <Link
                key={idea.id}
                href={`/ideas/${idea.id}`}
                className="flex items-center gap-3 rounded-xl bg-supp-soft/80 p-2.5"
              >
                <div className="relative h-12 w-12 overflow-hidden rounded-lg">
                  <Image src={idea.image} alt="" fill className="object-cover" sizes="48px" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{L.title}</p>
                  <p className="truncate text-xs text-supp-muted">{idea.date}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-4 mt-4 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold">{t("savedTitle")}</h2>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {favorited.map((idea) => {
            if (!idea) return null;
            const L = localizedIdea(idea, locale);
            return (
              <Link
                key={idea.id}
                href={`/ideas/${idea.id}`}
                className="overflow-hidden rounded-xl bg-supp-soft"
              >
                <div className="relative h-24">
                  <Image src={idea.image} alt="" fill className="object-cover" sizes="160px" />
                </div>
                <p className="line-clamp-2 p-2 text-xs font-medium">{L.title}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-4 mb-6 mt-4 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold">{t("friendsTitle")}</h2>
        <p className="mt-1 text-xs text-supp-muted">{t("friendsSub")}</p>
        <div className="mt-3 space-y-3">
          {mockFriends.map((friend) => (
            <div key={friend.id} className="flex items-center gap-3">
              <div className="relative h-11 w-11 overflow-hidden rounded-full">
                <Image src={friend.avatar} alt="" fill className="object-cover" sizes="44px" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {zh ? friend.nameZh : friend.name}
                </p>
                <p className="truncate text-xs text-supp-muted">
                  {zh ? friend.bioZh : friend.bio}
                </p>
              </div>
              <span className="rounded-full bg-supp-red/10 px-2 py-1 text-[11px] font-semibold text-supp-red">
                {friend.overlap}%
              </span>
            </div>
          ))}
        </div>
      </section>

      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/55"
            aria-label={t("closeSettings")}
            onClick={() => setSettingsOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="me-settings-title"
            className="relative z-10 flex max-h-[85vh] w-full max-w-md flex-col rounded-t-2xl bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-black/5 px-4 py-3">
              <h2 id="me-settings-title" className="text-base font-semibold">
                {t("settings")}
              </h2>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-supp-muted hover:bg-black/5 hover:text-supp-ink"
                aria-label={t("closeSettings")}
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-y-auto px-4 py-4 space-y-6">
              <section>
                <h3 className="mb-2 text-sm font-semibold text-supp-ink">
                  {t("language")}
                </h3>
                <LanguageSwitcher onLocaleChange={() => setSettingsOpen(false)} />
              </section>
              <section>
                <h3 className="mb-1 text-sm font-semibold text-supp-ink">
                  {t("currency")}
                </h3>
                <p className="mb-2 text-xs text-supp-muted">{t("currencyHint")}</p>
                <CurrencySwitcher />
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="text-base font-bold">{value}</p>
      <p className="text-[10px] text-white/65">{label}</p>
    </div>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.4 15a1.7 1.7 0 0 0 .34 1.86l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.86-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.1-1.55 1.7 1.7 0 0 0-1.86.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.86 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1.1 1.7 1.7 0 0 0-.34-1.86l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.86.34H9a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.86-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.86V9c.26.64.9 1.1 1.64 1.1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z"
      />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
