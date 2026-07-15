"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, useEffectEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { CurrencySwitcher } from "@/components/CurrencySwitcher";
import { SoulReportModal } from "@/components/SoulReportModal";
import { getIdeaById, localizedIdea, type Idea } from "@/data/mock-ideas";
import { scatterStyle } from "@/lib/scatter";

type MeUser = {
  id: string;
  nickname: string;
  avatar: string;
  avatarAnimalId: string | null;
  email: string | null;
  isGuest: boolean;
  authProvider: string;
  experienced: number;
  favorited: number;
  claimed: number;
  percentile: number;
  personaUnlocked: boolean;
  personaRoleId: string | null;
  personaAvatar: string | null;
  persona: string;
  personaZh: string;
  personaDesc: string;
  personaDescZh: string;
  favoritedIds: string[];
  experiencedIds: string[];
  experiencedAt: Record<string, string>;
  joinedIds: string[];
  followingIds: string[];
  followerIds: string[];
};

type SocialCard = {
  id: string;
  nickname: string;
  nicknameZh: string;
  avatar: string;
  persona: string;
  personaZh: string;
  overlapCount: number;
  isFollowing: boolean;
  followedYou: boolean;
};

type Animal = {
  id: string;
  species: string;
  adjective: string;
  nicknameHint: string;
  path: string;
};

export function MeView() {
  const t = useTranslations("me");
  const locale = useLocale();
  const zh = locale === "zh";
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [user, setUser] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [similar, setSimilar] = useState<SocialCard[]>([]);
  const [followers, setFollowers] = useState<SocialCard[]>([]);
  const [dimming, setDimming] = useState<Record<string, boolean>>({});
  const [soulReportOpen, setSoulReportOpen] = useState(false);

  const loadMe = useEffectEvent(async () => {
    setLoading(true);
    try {
      const [meRes, socialRes] = await Promise.all([
        fetch("/api/me"),
        fetch("/api/me/social"),
      ]);
      const meData = await meRes.json();
      const socialData = await socialRes.json();
      if (meData.user) setUser(meData.user);
      if (socialData.user) setUser(socialData.user);
      setSimilar(socialData.similar || []);
      setFollowers(socialData.followers || []);
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    void loadMe();
    const params = new URLSearchParams(window.location.search);
    if (params.get("authError")) {
      setAuthError(params.get("authError") || t("authError"));
      setSettingsOpen(true);
    }
    if (params.get("signedIn")) {
      setSettingsOpen(true);
    }
  }, [t]);

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

  const collectedIdeas = useMemo(
    () =>
      (user?.favoritedIds ?? [])
        .map((id) => getIdeaById(id))
        .filter((x): x is Idea => Boolean(x)),
    [user?.favoritedIds],
  );

  const experiencedByMonth = useMemo(() => {
    const at = user?.experiencedAt ?? {};
    const groups = new Map<string, Idea[]>();
    for (const id of user?.experiencedIds ?? []) {
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
  }, [user?.experiencedIds, user?.experiencedAt]);

  async function cancelIdea(
    ideaId: string,
    action: "favorite" | "experienced",
  ) {
    const key = `${action}:${ideaId}`;
    setDimming((s) => ({ ...s, [key]: true }));
    await new Promise((r) => window.setTimeout(r, 280));
    try {
      const res = await fetch("/api/me/idea-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId, action, active: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setUser(data.user);
      const socialRes = await fetch("/api/me/social");
      const socialData = await socialRes.json();
      setSimilar(socialData.similar || []);
      setFollowers(socialData.followers || []);
    } catch {
      // keep item
    } finally {
      setDimming((s) => {
        const next = { ...s };
        delete next[key];
        return next;
      });
    }
  }

  async function toggleFollow(userId: string, active: boolean) {
    setSimilar((list) =>
      list.map((u) => (u.id === userId ? { ...u, isFollowing: active } : u)),
    );
    setFollowers((list) =>
      list.map((u) => (u.id === userId ? { ...u, isFollowing: active } : u)),
    );
    try {
      const res = await fetch("/api/me/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      if (data.user) setUser(data.user);
    } catch {
      setSimilar((list) =>
        list.map((u) => (u.id === userId ? { ...u, isFollowing: !active } : u)),
      );
      setFollowers((list) =>
        list.map((u) => (u.id === userId ? { ...u, isFollowing: !active } : u)),
      );
    }
  }

  function monthLabel(key: string) {
    if (key === "Unknown") return key;
    const [y, m] = key.split("-").map(Number);
    const d = new Date(y!, (m ?? 1) - 1, 1);
    return d.toLocaleDateString(locale, { year: "numeric", month: "long" });
  }

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
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-white/70 bg-white/10"
              >
                {user?.avatar ? (
                  // Animal SVGs + arbitrary URLs — keep as native img
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="block h-full w-full animate-pulse bg-white/20" />
                )}
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-base font-semibold">
                    {loading ? "…" : user?.nickname || "—"}
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
                {user?.isGuest && (
                  <p className="mt-0.5 text-[10px] text-amber-200/90">
                    {t("guestBadge")}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-6 text-center text-xs">
              <Stat
                value={user?.experienced ?? 0}
                label={t("experienced")}
                onClick={() =>
                  document
                    .getElementById("me-experienced")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              />
              <Stat
                value={user?.favorited ?? 0}
                label={t("collected")}
                onClick={() =>
                  document
                    .getElementById("me-collected")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              />
            </div>
          </div>

          <div className="space-y-1 text-sm leading-relaxed text-white/90">
            <p>{t("summaryLead")}</p>
            <p>{t("summaryExperienced", { count: user?.experienced ?? 0 })}</p>
            <p>{t("summarySaved", { count: user?.favorited ?? 0 })}</p>
            <p>
              {t("summaryPercentile", { pct: user?.percentile ?? 0 })}
            </p>
            <p
              className={`pt-1 text-[22px] leading-snug tracking-wide text-white/85 ${
                zh ? "font-hand-zh" : "font-hand"
              }`}
            >
              {t("summaryQuote")}
            </p>
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={() => setSoulReportOpen(true)}
        disabled={!user || loading}
        className="relative mx-4 -mt-3 flex items-center gap-3 overflow-hidden rounded-xl bg-supp-red px-3 py-3 text-left text-white shadow-lg transition hover:brightness-110 disabled:opacity-50"
      >
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
          <Image src="/images/soul-dog.jpg" alt="" fill className="object-cover" sizes="48px" />
        </div>
        <span className="text-sm font-semibold leading-snug">{t("soulReport")}</span>
      </button>

      {user && (
        <SoulReportModal
          open={soulReportOpen}
          onClose={() => setSoulReportOpen(false)}
          user={user}
          collectedIdeas={collectedIdeas}
          experiencedByMonth={experiencedByMonth}
          similar={similar}
          monthLabel={monthLabel}
        />
      )}

      <section className="mx-4 mt-4 rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-supp-soft">
            {user?.personaUnlocked && user.personaAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.personaAvatar}
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
            {user?.personaUnlocked && user.persona ? (
              <>
                <p className="text-sm font-semibold">
                  {t("personaTitle", {
                    persona: zh ? user.personaZh || user.persona : user.persona,
                  })}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-supp-muted">
                  {zh
                    ? user.personaDescZh || user.personaDesc
                    : user.personaDesc}
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

      <section
        id="me-collected"
        className="mx-4 mt-4 scroll-mt-16 overflow-hidden rounded-2xl bg-white p-4 shadow-sm"
      >
        <div className="flex items-end justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold">{t("collectedTitle")}</h2>
            <p className="mt-0.5 text-[11px] text-supp-muted">{t("cancelHint")}</p>
          </div>
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
            const dimKey = `favorite:${idea.id}`;
            const dimmed = !!dimming[dimKey];
            return (
              <li
                key={idea.id}
                className={`origin-center transition-all duration-300 ${
                  dimmed ? "scale-95 opacity-30" : "hover:z-10 hover:rotate-0 hover:scale-[1.02]"
                }`}
                style={scatterStyle(idea.id, index)}
              >
                <div className="relative min-h-[6.5rem] overflow-hidden rounded-2xl border border-black/5 shadow-[0_8px_20px_rgba(0,0,0,0.12)]">
                  <Image
                    src={idea.image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="420px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/35" />
                  <Link
                    href={`/ideas/${idea.id}`}
                    className="absolute inset-0 z-10"
                    aria-label={L.title}
                  />
                  <div className="pointer-events-none relative z-20 flex min-h-[6.5rem] flex-col justify-between p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[14px] font-semibold leading-snug text-white">
                        {L.title}
                      </p>
                      <button
                        type="button"
                        aria-label={t("cancelCollection")}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          void cancelIdea(idea.id, "favorite");
                        }}
                        className="pointer-events-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/45 text-sm text-white backdrop-blur-sm"
                      >
                        ×
                      </button>
                    </div>
                    <span className="text-[11px] text-white/75">
                      {t("collected")}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section
        id="me-experienced"
        className="mx-4 mt-4 scroll-mt-16 overflow-hidden rounded-2xl bg-white p-4 shadow-sm"
      >
        <div className="flex items-end justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold">{t("experiencedTitle")}</h2>
            <p className="mt-0.5 text-[11px] text-supp-muted">{t("cancelHint")}</p>
          </div>
          <p className="text-xs font-semibold text-supp-red">
            {t("experiencedCountLabel", {
              count: user?.experiencedIds?.length ?? 0,
            })}
          </p>
        </div>

        {(user?.experiencedIds?.length ?? 0) === 0 && (
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
                  const dimKey = `experienced:${idea.id}`;
                  const dimmed = !!dimming[dimKey];
                  return (
                    <li
                      key={idea.id}
                      className={`origin-center transition-all duration-300 ${
                        dimmed
                          ? "scale-95 opacity-30"
                          : "hover:z-10 hover:rotate-0 hover:scale-[1.02]"
                      }`}
                      style={scatterStyle(`exp-${idea.id}`, index)}
                    >
                      <div className="relative min-h-[6.5rem] overflow-hidden rounded-2xl border border-black/5 shadow-[0_8px_20px_rgba(0,0,0,0.12)]">
                        <Image
                          src={idea.image}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="420px"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/35" />
                        <Link
                          href={`/ideas/${idea.id}`}
                          className="absolute inset-0 z-10"
                          aria-label={L.title}
                        />
                        <div className="pointer-events-none relative z-20 flex min-h-[6.5rem] flex-col justify-between p-3.5">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[14px] font-semibold leading-snug text-white">
                              {L.title}
                            </p>
                            <button
                              type="button"
                              aria-label={t("cancelExperience")}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                void cancelIdea(idea.id, "experienced");
                              }}
                              className="pointer-events-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/45 text-sm text-white backdrop-blur-sm"
                            >
                              ×
                            </button>
                          </div>
                          <span className="text-[11px] text-white/75">
                            {t("experienced")}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-4 mt-4 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold">{t("friendsTitle")}</h2>
        <p className="mt-1 text-xs text-supp-muted">{t("friendsSub")}</p>
        <div className="mt-3 space-y-3">
          {similar.length === 0 && (
            <p className="text-xs text-supp-muted">{t("emptySimilar")}</p>
          )}
          {similar.map((friend) => (
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
              <div className="flex shrink-0 flex-col gap-1.5">
                <Link
                  href={`/users/${friend.id}`}
                  className="rounded-full border border-black/10 px-2.5 py-1 text-center text-[10px] font-semibold"
                >
                  {t("viewProfile")}
                </Link>
                <button
                  type="button"
                  onClick={() =>
                    void toggleFollow(friend.id, !friend.isFollowing)
                  }
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                    friend.isFollowing
                      ? "bg-black/5 text-supp-ink"
                      : "bg-supp-red text-white"
                  }`}
                >
                  {friend.isFollowing ? t("following") : t("follow")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-4 mb-6 mt-4 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold">{t("followersTitle")}</h2>
        <p className="mt-1 text-xs text-supp-muted">{t("followersSub")}</p>
        <div className="mt-3 space-y-3">
          {followers.length === 0 && (
            <p className="text-xs text-supp-muted">{t("emptyFollowers")}</p>
          )}
          {followers.map((person) => (
            <div key={person.id} className="flex items-center gap-3">
              <Link
                href={`/users/${person.id}`}
                className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-supp-soft"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={person.avatar}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/users/${person.id}`}
                  className="block text-sm font-medium"
                >
                  {zh ? person.nicknameZh || person.nickname : person.nickname}
                </Link>
                <p className="truncate text-xs text-supp-muted">
                  {person.overlapCount > 0
                    ? t("overlapCount", { count: person.overlapCount })
                    : t("followersSub")}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-1.5">
                <Link
                  href={`/users/${person.id}`}
                  className="rounded-full border border-black/10 px-2.5 py-1 text-center text-[10px] font-semibold"
                >
                  {t("viewProfile")}
                </Link>
                <button
                  type="button"
                  onClick={() =>
                    void toggleFollow(person.id, !person.isFollowing)
                  }
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                    person.isFollowing
                      ? "bg-black/5 text-supp-ink"
                      : "bg-supp-red text-white"
                  }`}
                >
                  {person.isFollowing ? t("following") : t("follow")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {settingsOpen && user && (
        <SettingsSheet
          user={user}
          authError={authError}
          onClose={() => {
            setSettingsOpen(false);
            setAuthError("");
          }}
          onUser={(u) => setUser(u)}
        />
      )}
    </div>
  );
}

function SettingsSheet({
  user,
  authError,
  onClose,
  onUser,
}: {
  user: MeUser;
  authError: string;
  onClose: () => void;
  onUser: (u: MeUser) => void;
}) {
  const t = useTranslations("me");
  const locale = useLocale();
  const [nickname, setNickname] = useState(user.nickname);
  const [avatarAnimalId, setAvatarAnimalId] = useState(user.avatarAnimalId);
  const [avatarPreview, setAvatarPreview] = useState(user.avatar);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [totalAnimals, setTotalAnimals] = useState(0);
  const [avatarQ, setAvatarQ] = useState("");
  const [loadingAnimals, setLoadingAnimals] = useState(false);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [devCode, setDevCode] = useState<string | undefined>();
  const [authBusy, setAuthBusy] = useState(false);
  const [authMsg, setAuthMsg] = useState(authError);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  useEffect(() => {
    void fetch("/api/auth/providers")
      .then((r) => r.json())
      .then((d) => setGoogleEnabled(Boolean(d.googleEnabled)))
      .catch(() => setGoogleEnabled(false));
  }, []);

  async function loadAnimals(offset = 0, append = false) {
    setLoadingAnimals(true);
    try {
      const params = new URLSearchParams({
        offset: String(offset),
        limit: "48",
      });
      if (avatarQ.trim()) params.set("q", avatarQ.trim());
      const res = await fetch(`/api/avatars?${params}`);
      const data = await res.json();
      setTotalAnimals(data.total || 0);
      setAnimals((prev) =>
        append ? [...prev, ...(data.animals || [])] : data.animals || [],
      );
    } finally {
      setLoadingAnimals(false);
    }
  }

  useEffect(() => {
    void loadAnimals(0, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveProfile() {
    setSaving(true);
    setSavedMsg("");
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname,
          avatarAnimalId: avatarAnimalId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      onUser(data.user);
      setSavedMsg(t("profileSaved"));
    } catch (e) {
      setSavedMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function submitPasswordLogin() {
    setAuthBusy(true);
    setAuthMsg("");
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      onUser(data.user);
      setAuthMsg(t("signedIn"));
      setLoginPassword("");
    } catch (e) {
      setAuthMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setAuthBusy(false);
    }
  }

  async function sendCode() {
    setAuthBusy(true);
    setAuthMsg("");
    try {
      const res = await fetch("/api/auth/email/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setCodeSent(true);
      setDevCode(data.devCode);
      setAuthMsg(t("codeSent"));
    } catch (e) {
      setAuthMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setAuthBusy(false);
    }
  }

  async function verifyCode() {
    setAuthBusy(true);
    setAuthMsg("");
    try {
      const res = await fetch("/api/auth/email/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      onUser(data.user);
      setAuthMsg(t("signedIn"));
      setCodeSent(false);
      setDevCode(undefined);
    } catch (e) {
      setAuthMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setAuthBusy(false);
    }
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    // Re-provision guest on next load
    const res = await fetch("/api/me");
    const data = await res.json();
    if (data.user) {
      onUser(data.user);
      setNickname(data.user.nickname);
      setAvatarAnimalId(data.user.avatarAnimalId);
      setAvatarPreview(data.user.avatar);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/55"
        aria-label={t("closeSettings")}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="me-settings-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-md flex-col rounded-t-2xl bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-black/5 px-4 py-3">
          <h2 id="me-settings-title" className="text-base font-semibold">
            {t("settings")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-supp-muted hover:bg-black/5 hover:text-supp-ink"
            aria-label={t("closeSettings")}
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 overflow-y-auto px-4 py-4">
          <section>
            <h3 className="mb-1 text-sm font-semibold text-supp-ink">
              {t("profileSection")}
            </h3>
            <p className="mb-3 text-[11px] text-supp-muted">
              {t("userIdLabel", { id: user.id })}
            </p>

            <div className="mb-3 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarPreview}
                alt=""
                className="h-14 w-14 rounded-full border border-black/10 object-cover"
              />
              <div className="min-w-0 flex-1">
                <label className="text-xs text-supp-muted">{t("nickname")}</label>
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={32}
                  className="mt-1 w-full rounded-xl border border-black/10 bg-[#f7f7f7] px-3 py-2 text-sm outline-none ring-supp-red focus:ring-2"
                />
                <p className="mt-1 text-[11px] text-supp-muted">
                  {t("nicknameHint")}
                </p>
              </div>
            </div>

            <h4 className="mb-2 text-xs font-semibold text-supp-ink">
              {t("changeAvatar")}
            </h4>
            <div className="mb-2 flex gap-2">
              <input
                value={avatarQ}
                onChange={(e) => setAvatarQ(e.target.value)}
                placeholder={t("searchAvatars")}
                className="min-w-0 flex-1 rounded-xl border border-black/10 bg-[#f7f7f7] px-3 py-2 text-sm outline-none ring-supp-red focus:ring-2"
              />
              <button
                type="button"
                onClick={() => void loadAnimals(0, false)}
                className="rounded-xl bg-black px-3 py-2 text-xs font-semibold text-white"
              >
                Go
              </button>
            </div>
            <div className="grid max-h-48 grid-cols-6 gap-2 overflow-y-auto rounded-xl bg-[#f7f7f7] p-2">
              {animals.map((a) => {
                const active = a.id === avatarAnimalId;
                return (
                  <button
                    key={a.id}
                    type="button"
                    title={a.nicknameHint}
                    onClick={() => {
                      setAvatarAnimalId(a.id);
                      setAvatarPreview(a.path);
                    }}
                    className={`overflow-hidden rounded-full border-2 ${
                      active ? "border-supp-red" : "border-transparent"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.path} alt={a.nicknameHint} className="h-full w-full" />
                  </button>
                );
              })}
            </div>
            {animals.length < totalAnimals && (
              <button
                type="button"
                disabled={loadingAnimals}
                onClick={() => void loadAnimals(animals.length, true)}
                className="mt-2 w-full rounded-xl border border-black/10 py-2 text-xs font-medium text-supp-ink"
              >
                {t("loadMoreAvatars")}
              </button>
            )}

            <button
              type="button"
              disabled={saving}
              onClick={() => void saveProfile()}
              className="mt-3 w-full rounded-xl bg-supp-red py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {t("saveProfile")}
            </button>
            {savedMsg && (
              <p className="mt-2 text-xs text-supp-muted">{savedMsg}</p>
            )}
          </section>

          <section>
            <h3 className="mb-1 text-sm font-semibold text-supp-ink">
              {t("signInSection")}
            </h3>
            <p className="mb-3 text-xs text-supp-muted">{t("signInHint")}</p>

            {user.isGuest ? (
              <div className="space-y-3">
                {googleEnabled ? (
                  <a
                    href={`/api/auth/google?locale=${encodeURIComponent(locale)}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-black/10 bg-white py-2.5 text-sm font-semibold text-supp-ink transition hover:bg-black/[0.03]"
                  >
                    <GoogleGlyph />
                    {t("googleSignIn")}
                  </a>
                ) : (
                  <p className="text-[11px] text-supp-muted">
                    {t("googleUnavailable")}
                  </p>
                )}

                <div className="rounded-xl border border-black/8 bg-[#f7f7f7] p-3">
                  <p className="text-xs font-semibold text-supp-ink">
                    {t("passwordSignIn")}
                  </p>
                  <label className="mt-2 block text-xs text-supp-muted">
                    {t("username")}
                    <input
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      autoComplete="username"
                      className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-supp-ink outline-none ring-supp-red focus:ring-2"
                      placeholder="demo001"
                    />
                  </label>
                  <label className="mt-2 block text-xs text-supp-muted">
                    {t("password")}
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      autoComplete="current-password"
                      className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-supp-ink outline-none ring-supp-red focus:ring-2"
                      placeholder="Demo001!"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={
                      authBusy ||
                      !loginUsername.trim() ||
                      !loginPassword.trim()
                    }
                    onClick={() => void submitPasswordLogin()}
                    className="mt-3 w-full rounded-xl bg-supp-red py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {t("passwordSignInAction")}
                  </button>
                </div>

                <label className="block text-xs text-supp-muted">
                  {t("email")}
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-black/10 bg-[#f7f7f7] px-3 py-2 text-sm text-supp-ink outline-none ring-supp-red focus:ring-2"
                  />
                </label>
                {!codeSent ? (
                  <button
                    type="button"
                    disabled={authBusy || !email.trim()}
                    onClick={() => void sendCode()}
                    className="w-full rounded-xl bg-black py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {t("sendCode")}
                  </button>
                ) : (
                  <>
                    <label className="block text-xs text-supp-muted">
                      {t("code")}
                      <input
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        inputMode="numeric"
                        maxLength={6}
                        className="mt-1 w-full rounded-xl border border-black/10 bg-[#f7f7f7] px-3 py-2 text-sm tracking-[0.3em] text-supp-ink outline-none ring-supp-red focus:ring-2"
                      />
                    </label>
                    {devCode && (
                      <p className="rounded-lg bg-amber-50 px-2 py-1.5 font-mono text-xs text-amber-800">
                        Dev code: {devCode}
                      </p>
                    )}
                    <button
                      type="button"
                      disabled={authBusy || code.trim().length < 6}
                      onClick={() => void verifyCode()}
                      className="w-full rounded-xl bg-black py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {t("verifyCode")}
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-supp-muted">
                  {user.email || user.authProvider}
                </p>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="w-full rounded-xl border border-black/10 py-2.5 text-sm font-semibold text-supp-ink"
                >
                  {t("signOut")}
                </button>
              </div>
            )}
            {authMsg && (
              <p className="mt-2 text-xs text-supp-muted">{authMsg}</p>
            )}
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-supp-ink">
              {t("language")}
            </h3>
            <LanguageSwitcher onLocaleChange={onClose} />
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
  );
}

function Stat({
  value,
  label,
  onClick,
}: {
  value: number;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-center transition hover:opacity-85"
    >
      <p className="text-base font-bold">{value}</p>
      <p className="text-[10px] text-white/65">{label}</p>
    </button>
  );
}

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l.1.1 6.2 5.2C39.2 37.3 44 32 44 24c0-1.3-.1-2.5-.4-3.5z"/>
    </svg>
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
