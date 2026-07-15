"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { getIdeaById, localizedIdea, type Idea } from "@/data/mock-ideas";
import { scatterStyle } from "@/lib/scatter";

type SimilarCard = {
  id: string;
  nickname: string;
  nicknameZh: string;
  avatar: string;
  persona: string;
  personaZh: string;
  overlapCount: number;
};

type Profile = {
  id: string;
  nickname: string;
  nicknameZh: string;
  avatar: string;
  persona: string;
  personaZh: string;
  personaDesc: string;
  personaDescZh: string;
  personaAvatar: string | null;
  personaUnlocked: boolean;
  experienced: number;
  favorited: number;
  percentile: number;
  favoritedIds: string[];
  experiencedIds: string[];
  experiencedAt: Record<string, string>;
  followerCount: number;
  followingCount: number;
  overlapCount: number;
  isFollowing: boolean;
  isSelf: boolean;
  similar: SimilarCard[];
};

/** Third-person Me page: no settings, no soul-report long image. */
export function UserProfileView({ userId }: { userId: string }) {
  const t = useTranslations("me");
  const locale = useLocale();
  const zh = locale === "zh";
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/users/${userId}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Not found");
        if (cancelled) return;
        if (data.profile?.isSelf) {
          router.replace("/me");
          return;
        }
        setProfile(data.profile);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed");
      });
    return () => {
      cancelled = true;
    };
  }, [userId, router]);

  const collectedIdeas = useMemo(
    () =>
      (profile?.favoritedIds ?? [])
        .map((id) => getIdeaById(id))
        .filter((x): x is Idea => Boolean(x)),
    [profile?.favoritedIds],
  );

  const experiencedByMonth = useMemo(() => {
    if (!profile) return [] as [string, Idea[]][];
    const at = profile.experiencedAt ?? {};
    const groups = new Map<string, Idea[]>();
    for (const id of profile.experiencedIds ?? []) {
      const idea = getIdeaById(id);
      if (!idea) continue;
      const iso = at[id] || idea.startsAt || idea.date || new Date().toISOString();
      const d = new Date(iso);
      const key = Number.isNaN(d.getTime())
        ? "Unknown"
        : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const list = groups.get(key) ?? [];
      list.push(idea);
      groups.set(key, list);
    }
    return [...groups.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [profile]);

  function monthLabel(key: string) {
    if (key === "Unknown") return key;
    const [y, m] = key.split("-").map(Number);
    const d = new Date(y!, (m ?? 1) - 1, 1);
    return d.toLocaleDateString(locale, { year: "numeric", month: "long" });
  }

  async function toggleFollow() {
    if (!profile || profile.isSelf || busy) return;
    setBusy(true);
    const next = !profile.isFollowing;
    setProfile({ ...profile, isFollowing: next });
    try {
      const res = await fetch("/api/me/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profile.id, active: next }),
      });
      if (!res.ok) throw new Error("Failed");
      setProfile((p) =>
        p
          ? {
              ...p,
              isFollowing: next,
              followerCount: Math.max(0, p.followerCount + (next ? 1 : -1)),
            }
          : p,
      );
    } catch {
      setProfile({ ...profile, isFollowing: !next });
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <div className="min-h-full bg-[#f5f5f5] p-6 text-supp-ink">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-supp-muted"
        >
          ← {t("back")}
        </button>
        <p className="mt-6 text-sm">{error}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-full bg-[#f5f5f5] p-6 text-sm text-supp-muted">…</div>
    );
  }

  const displayName = zh
    ? profile.nicknameZh || profile.nickname
    : profile.nickname;

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
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-lg backdrop-blur-sm"
            aria-label={t("back")}
          >
            ←
          </button>

          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-white/70 bg-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={profile.avatar}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <p className="text-base font-semibold">{displayName}</p>
                <p className="text-[11px] text-white/65">
                  {t("overlapCount", { count: profile.overlapCount })}
                </p>
              </div>
            </div>
            <div className="flex gap-6 text-center text-xs">
              <div>
                <p className="text-base font-bold">{profile.experienced}</p>
                <p className="text-white/60">{t("experienced")}</p>
              </div>
              <div>
                <p className="text-base font-bold">{profile.favorited}</p>
                <p className="text-white/60">{t("collected")}</p>
              </div>
            </div>
          </div>

          <div className="space-y-1 text-sm leading-relaxed text-white/90">
            <p>{t("summaryLead")}</p>
            <p>{t("summaryExperienced", { count: profile.experienced })}</p>
            <p>{t("summarySaved", { count: profile.favorited })}</p>
            <p>{t("summaryPercentile", { pct: profile.percentile })}</p>
            <p
              className={`pt-1 text-[22px] leading-snug tracking-wide text-white/85 ${
                zh ? "font-hand-zh" : "font-hand"
              }`}
            >
              {t("summaryQuote")}
            </p>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={() => void toggleFollow()}
            className={`w-full rounded-full py-2.5 text-sm font-semibold transition ${
              profile.isFollowing
                ? "border border-white/30 bg-white/10 text-white"
                : "bg-supp-red text-white"
            }`}
          >
            {profile.isFollowing ? t("following") : t("follow")}
          </button>
        </div>
      </section>

      {/* No soul-report CTA in third-person view */}

      <section className="mx-4 mt-4 rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-supp-soft">
            {profile.personaUnlocked && profile.personaAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.personaAvatar}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-black/10 to-black/5 text-lg text-supp-muted">
                ?
              </div>
            )}
          </div>
          <div className="min-w-0">
            {profile.personaUnlocked && profile.persona ? (
              <>
                <p className="text-sm font-semibold">
                  {t("personaTitle", {
                    persona: zh
                      ? profile.personaZh || profile.persona
                      : profile.persona,
                  })}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-supp-muted">
                  {zh
                    ? profile.personaDescZh || profile.personaDesc
                    : profile.personaDesc}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold">{t("personaLockedTitle")}</p>
                <p className="mt-1 text-xs leading-relaxed text-supp-muted">
                  {t("personaLockedDesc")}
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="mx-4 mt-4 overflow-hidden rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-end justify-between gap-2">
          <h2 className="text-sm font-semibold">{t("collectedTitle")}</h2>
          <p className="text-xs font-semibold text-supp-red">
            {t("collectedCount", { count: collectedIdeas.length })}
          </p>
        </div>
        <ul className="mt-4 space-y-4 overflow-x-hidden px-1 pb-1">
          {collectedIdeas.length === 0 && (
            <li className="text-xs text-supp-muted">{t("emptyCollected")}</li>
          )}
          {collectedIdeas.map((idea, index) => {
            const L = localizedIdea(idea, locale);
            return (
              <li
                key={idea.id}
                className="origin-center transition hover:z-10 hover:rotate-0 hover:scale-[1.02]"
                style={scatterStyle(idea.id, index)}
              >
                <Link
                  href={`/ideas/${idea.id}`}
                  className="relative block min-h-[6.5rem] overflow-hidden rounded-2xl border border-black/5 shadow-[0_8px_20px_rgba(0,0,0,0.12)]"
                >
                  <Image
                    src={idea.image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="420px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/35" />
                  <div className="relative z-10 flex min-h-[6.5rem] flex-col justify-between p-3.5">
                    <p className="text-[14px] font-semibold leading-snug text-white">
                      {L.title}
                    </p>
                    <span className="text-[11px] text-white/75">
                      {t("collected")}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mx-4 mt-4 overflow-hidden rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-end justify-between gap-2">
          <h2 className="text-sm font-semibold">{t("experiencedTitle")}</h2>
          <p className="text-xs font-semibold text-supp-red">
            {t("experiencedCountLabel", {
              count: profile.experiencedIds.length,
            })}
          </p>
        </div>
        {profile.experiencedIds.length === 0 && (
          <p className="mt-3 text-xs text-supp-muted">{t("emptyExperienced")}</p>
        )}
        <div className="mt-3 space-y-5">
          {experiencedByMonth.map(([monthKey, ideas]) => (
            <div key={monthKey}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-supp-muted">
                {monthLabel(monthKey)}
                <span className="ml-2 font-normal normal-case">
                  · {ideas.length}
                </span>
              </p>
              <ul className="space-y-4 overflow-x-hidden px-1">
                {ideas.map((idea, index) => {
                  const L = localizedIdea(idea, locale);
                  return (
                    <li
                      key={idea.id}
                      className="origin-center transition hover:z-10 hover:rotate-0 hover:scale-[1.02]"
                      style={scatterStyle(`exp-${idea.id}`, index)}
                    >
                      <Link
                        href={`/ideas/${idea.id}`}
                        className="relative block min-h-[6.5rem] overflow-hidden rounded-2xl border border-black/5 shadow-[0_8px_20px_rgba(0,0,0,0.12)]"
                      >
                        <Image
                          src={idea.image}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="420px"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/35" />
                        <div className="relative z-10 flex min-h-[6.5rem] flex-col justify-between p-3.5">
                          <p className="text-[14px] font-semibold leading-snug text-white">
                            {L.title}
                          </p>
                          <span className="text-[11px] text-white/75">
                            {t("experienced")}
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-4 mb-8 mt-4 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold">{t("friendsTitle")}</h2>
        <p className="mt-1 text-xs text-supp-muted">{t("friendsSub")}</p>
        <div className="mt-3 space-y-3">
          {profile.similar.length === 0 && (
            <p className="text-xs text-supp-muted">{t("emptySimilar")}</p>
          )}
          {profile.similar.map((friend) => (
            <div key={friend.id} className="flex items-center gap-3">
              <Link
                href={`/users/${friend.id}`}
                className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-supp-soft"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={friend.avatar}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/users/${friend.id}`}
                  className="block text-sm font-medium"
                >
                  {zh ? friend.nicknameZh || friend.nickname : friend.nickname}
                </Link>
                <p className="truncate text-xs text-supp-muted">
                  {t("overlapCount", { count: friend.overlapCount })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
