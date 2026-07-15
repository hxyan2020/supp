"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { IdeaComments } from "@/components/IdeaComments";
import { UserAvatar } from "@/components/UserAvatar";
import { hasMappableAddress, navigationUrl } from "@/lib/map-address";
import {
  resolveSocialEmbedSrc,
  socialEmbedAspect,
} from "@/lib/social-embed";
import {
  getExperiencedUsersForIdea,
  localizedIdea,
  type Idea,
} from "@/data/mock-ideas";

type MeLite = {
  nickname: string;
  avatar: string;
  favoritedIds: string[];
  experiencedIds: string[];
  personaUnlocked?: boolean;
  persona?: string;
  personaZh?: string;
};

export function IdeaDetailView({ idea }: { idea: Idea }) {
  const t = useTranslations("idea");
  const tMe = useTranslations("me");
  const locale = useLocale();
  const L = localizedIdea(idea, locale);
  const [favorited, setFavorited] = useState(false);
  const [experienced, setExperienced] = useState(false);
  const [shared, setShared] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [me, setMe] = useState<MeLite | null>(null);
  const [toast, setToast] = useState("");
  const zh = locale === "zh";

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  }

  useEffect(() => {
    void fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) return;
        setMe(data.user);
        setFavorited((data.user.favoritedIds || []).includes(idea.id));
        setExperienced((data.user.experiencedIds || []).includes(idea.id));
      })
      .catch(() => {});
  }, [idea.id]);

  async function toggleAction(
    action: "favorite" | "experienced",
    next: boolean,
  ) {
    if (busy) return;
    setBusy(true);
    const prevFav = favorited;
    const prevExp = experienced;
    if (action === "favorite") setFavorited(next);
    else setExperienced(next);

    try {
      const res = await fetch("/api/me/idea-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId: idea.id, action, active: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMe(data.user);
      setFavorited((data.user.favoritedIds || []).includes(idea.id));
      setExperienced((data.user.experiencedIds || []).includes(idea.id));
      if (action === "experienced") {
        showToast(next ? t("toastExperiencedOn") : t("toastExperiencedOff"));
      } else {
        showToast(next ? t("toastCollectOn") : t("toastCollectOff"));
      }
      const { notifyMeListsChanged } = await import("@/lib/me-lists-sync");
      notifyMeListsChanged({
        action,
        active: next,
        idea,
        at: next && action === "experienced" ? new Date().toISOString() : undefined,
      });
      if (data.user?.personaUnlocked && data.user?.persona) {
        window.setTimeout(() => {
          showToast(
            `${tMe("personaUpdated")}${
              data.user.persona
                ? ` · ${zh ? data.user.personaZh || data.user.persona : data.user.persona}`
                : ""
            }`,
          );
        }, 2500);
      }
    } catch {
      setFavorited(prevFav);
      setExperienced(prevExp);
      showToast(t("toastFailed"));
    } finally {
      setBusy(false);
    }
  }

  function pageUrl() {
    if (typeof window !== "undefined") return window.location.href;
    return `/ideas/${idea.id}`;
  }

  function openShareSheet() {
    setShareOpen(true);
  }

  async function copyPageLink() {
    const url = pageUrl();
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const input = document.createElement("input");
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      setShared(true);
      setShareOpen(false);
      showToast(t("shareCopied"));
    } catch {
      showToast(t("toastFailed"));
    }
  }

  function shareTo(network: "whatsapp" | "x" | "facebook" | "telegram" | "weibo") {
    const url = encodeURIComponent(pageUrl());
    const text = encodeURIComponent(`${L.title} — ${L.summary}`);
    const href =
      network === "whatsapp"
        ? `https://wa.me/?text=${text}%20${url}`
        : network === "x"
          ? `https://twitter.com/intent/tweet?url=${url}&text=${text}`
          : network === "facebook"
            ? `https://www.facebook.com/sharer/sharer.php?u=${url}`
            : network === "telegram"
              ? `https://t.me/share/url?url=${url}&text=${text}`
              : `https://service.weibo.com/share/share.php?url=${url}&title=${text}`;
    window.open(href, "_blank", "noopener,noreferrer");
    setShared(true);
    setShareOpen(false);
    showToast(t("toastShared"));
  }

  async function shareNative() {
    const url = pageUrl();
    try {
      if (navigator.share) {
        await navigator.share({
          title: L.title,
          text: L.summary,
          url,
        });
        setShared(true);
        setShareOpen(false);
        showToast(t("toastShared"));
      }
    } catch {
      // user cancelled
    }
  }

  useEffect(() => {
    if (!shareOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShareOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [shareOpen]);

  function onClaim() {
    const next = !claimed;
    setClaimed(next);
    showToast(next ? t("toastClaimedOn") : t("toastClaimedOff"));
  }

  const experiencedUsers = useMemo(() => {
    const base = getExperiencedUsersForIdea(idea.id);
    if (!experienced || !me) return base;
    const self = {
      id: "self",
      name: me.nickname,
      nameZh: me.nickname,
      avatar: me.avatar,
    };
    return [self, ...base.filter((u) => u.avatar !== me.avatar)];
  }, [idea.id, experienced, me]);

  const showMap = hasMappableAddress(idea);
  const [MapSnippet, setMapSnippet] = useState<React.ComponentType<{
    idea: Idea;
    locale: string;
  }> | null>(null);

  const steps = L.steps ?? [];
  const needs = L.needs ?? [];
  const visibleSocialEmbeds = useMemo(() => {
    const embeds = idea.socialEmbeds ?? [];
    if (zh) return embeds;
    return embeds.filter((e) => e.platform !== "xiaohongshu");
  }, [idea.socialEmbeds, zh]);

  const mapsUrl = showMap ? navigationUrl(idea, locale) : "/map";

  useEffect(() => {
    if (!showMap) return;
    void import("./IdeaMapSnippet").then((mod) =>
      setMapSnippet(() => mod.IdeaMapSnippet),
    );
  }, [showMap]);

  return (
    <article className="min-h-full bg-[#2a2a2a] text-white">
      <div className="relative h-[52.8vh] min-h-[308px]">
        <Image
          src={idea.image}
          alt={L.title}
          fill
          priority
          className="object-cover"
          sizes="500px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/10" />

        <Link
          href="/explore"
          className="absolute left-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-lg backdrop-blur-sm"
          aria-label={t("back")}
        >
          ←
        </Link>

        <div className="absolute inset-x-0 bottom-0 space-y-2 rounded-t-2xl bg-black/70 px-4 py-4 backdrop-blur-[2px]">
          <h1 className="text-xl font-bold leading-snug tracking-tight">{L.title}</h1>
          <p className="text-xs text-white/80">
            {t("category")}: {L.categories.join(" | ")}
          </p>
          <p className="text-xs text-white/80">
            {t("duration")}: {idea.durationMin} {t("minutes")}
          </p>
          <p className="text-[11px] text-white/65">
            {t("publishedBy", { name: L.organizer })}
          </p>
        </div>
      </div>

      <div className="-mt-3 rounded-t-2xl bg-white text-supp-ink">
        <div className="grid grid-cols-4 border-b border-black/8 px-1 py-4 text-center">
          <ActionButton
            active={experienced}
            onClick={() => void toggleAction("experienced", !experienced)}
            icon="✓"
            label={t("experienced")}
          />
          <ActionButton
            active={favorited}
            onClick={() => void toggleAction("favorite", !favorited)}
            icon="♥"
            label={t("collect")}
            lit="red"
          />
          <ActionButton
            active={shared}
            onClick={openShareSheet}
            icon="⤴"
            label={t("share")}
          />
          <ActionButton
            active={claimed}
            onClick={onClaim}
            icon="¥"
            label={t("claim")}
            note={t("claimNote")}
            lit="red"
          />
        </div>

        <p className="border-b border-black/8 px-4 py-2 text-xs text-supp-muted">
          {t("experienced")}: {idea.experiencedCount + (experienced ? 1 : 0)}
          <span className="mx-2">|</span>
          {t("collect")}: {idea.favoritedCount + (favorited ? 1 : 0)}
        </p>

        <div className="border-b border-black/8 px-4 py-3">
          <p className="mb-2 text-[11px] font-medium text-supp-muted">
            {t("experiencedBy")}
          </p>
          <div
            className="flex gap-2.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="list"
            aria-label={t("experiencedBy")}
          >
            {experiencedUsers.map((user) => (
              <Link
                key={user.id}
                href={user.id === "self" ? "/me" : `/users/${user.id}`}
                role="listitem"
                className="flex w-12 shrink-0 flex-col items-center gap-1"
                title={zh ? user.nameZh : user.name}
              >
                <div className="relative h-11 w-11 overflow-hidden rounded-full border border-black/10 bg-supp-soft">
                  <UserAvatar
                    src={user.avatar}
                    alt={zh ? user.nameZh : user.name}
                  />
                </div>
                <span className="w-full truncate text-center text-[9px] text-supp-muted">
                  {zh ? user.nameZh : user.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {shareOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
            aria-label={t("shareCancel")}
            onClick={() => setShareOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("shareSheetTitle")}
            className="relative z-10 w-full max-w-md animate-fade-up rounded-t-3xl bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] text-supp-ink shadow-2xl sm:rounded-3xl sm:p-5"
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-black/15 sm:hidden" />
            <h2 className="text-base font-semibold">{t("shareSheetTitle")}</h2>
            <p className="mt-1 line-clamp-2 text-xs text-supp-muted">{L.title}</p>

            <div className="mt-4 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              <ShareOption
                label={t("shareCopyLink")}
                onClick={() => void copyPageLink()}
                tone="neutral"
              >
                <CopyIcon />
              </ShareOption>
              <ShareOption
                label={t("shareWhatsApp")}
                onClick={() => shareTo("whatsapp")}
                tone="green"
              >
                <WhatsAppIcon />
              </ShareOption>
              <ShareOption label={t("shareX")} onClick={() => shareTo("x")} tone="dark">
                <XIcon />
              </ShareOption>
              <ShareOption
                label={t("shareFacebook")}
                onClick={() => shareTo("facebook")}
                tone="blue"
              >
                <FacebookIcon />
              </ShareOption>
              <ShareOption
                label={t("shareTelegram")}
                onClick={() => shareTo("telegram")}
                tone="sky"
              >
                <TelegramIcon />
              </ShareOption>
              {zh && (
                <ShareOption
                  label={t("shareWeibo")}
                  onClick={() => shareTo("weibo")}
                  tone="orange"
                >
                  <WeiboIcon />
                </ShareOption>
              )}
              {canNativeShare && (
                <ShareOption
                  label={t("shareMore")}
                  onClick={() => void shareNative()}
                  tone="neutral"
                >
                  <MoreIcon />
                </ShareOption>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShareOpen(false)}
              className="mt-4 w-full rounded-xl border border-black/10 py-3 text-sm font-medium text-supp-muted transition hover:bg-black/[0.03]"
            >
              {t("shareCancel")}
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-md animate-fade-up rounded-2xl bg-black/90 px-4 py-3 text-center text-sm font-medium text-white shadow-xl backdrop-blur-sm"
        >
          {toast}
        </div>
      )}

      <div className="space-y-4 px-4 pb-24 pt-5">
        <div className="rounded-2xl bg-supp-red/90 p-4 shadow-lg shadow-red-950/30 animate-fade-up backdrop-blur-sm">
          <p className="text-sm font-semibold">#{L.title}</p>
          <p className="mt-3 text-[15px] leading-relaxed text-white/95">
            “{L.tip}”
          </p>
          <div className="mt-4 flex items-center gap-2">
            {idea.creatorUserId ? (
              <Link
                href={`/users/${idea.creatorUserId}`}
                className="flex items-center gap-2"
              >
                <div className="relative h-8 w-8 overflow-hidden rounded-full border border-white/40">
                  <UserAvatar src={idea.organizerAvatar} />
                </div>
                <p className="text-xs text-white/85">
                  {t("claimedBy", { name: L.organizer })}
                </p>
              </Link>
            ) : (
              <>
                <div className="relative h-8 w-8 overflow-hidden rounded-full border border-white/40">
                  <UserAvatar src={idea.organizerAvatar} />
                </div>
                <p className="text-xs text-white/85">
                  {t("claimedBy", { name: L.organizer })}
                </p>
              </>
            )}
          </div>
        </div>

        <section className="rounded-2xl bg-black/70 p-4 backdrop-blur-sm">
          <h2 className="text-sm font-semibold text-white/90">{t("about")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/70">{L.description}</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div>
              <dt className="text-white/45">{t("location")}</dt>
              <dd className="mt-1 text-white/85">{L.location}</dd>
            </div>
            <div>
              <dt className="text-white/45">{t("when")}</dt>
              <dd className="mt-1 text-white/85">{idea.date}</dd>
            </div>
            <div>
              <dt className="text-white/45">{t("address")}</dt>
              <dd className="mt-1 text-white/85">{L.address}</dd>
            </div>
            <div>
              <dt className="text-white/45">{t("fee")}</dt>
              <dd className="mt-1 text-white/85">
                {idea.fee === 0 ? t("free") : `¥${idea.fee}`}
              </dd>
            </div>
          </dl>
          {showMap && MapSnippet && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block overflow-hidden rounded-2xl border border-white/10"
            >
              <div className="pointer-events-none h-40 w-full">
                <MapSnippet idea={idea} locale={locale} />
              </div>
              <p className="border-t border-white/10 bg-black/30 px-3 py-2 text-[11px] text-white/60">
                {L.address}
              </p>
            </a>
          )}
        </section>

        {steps.length > 0 && (
          <section className="rounded-2xl bg-black/70 p-4 backdrop-blur-sm">
            <h2 className="text-sm font-semibold text-white/90">{t("steps")}</h2>
            <ol className="mt-3 space-y-2.5">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed text-white/80">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-supp-red/90 text-[11px] font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {needs.length > 0 && (
          <section className="rounded-2xl bg-black/70 p-4 backdrop-blur-sm">
            <h2 className="text-sm font-semibold text-white/90">{t("whatYouNeed")}</h2>
            <ul className="mt-3 space-y-2">
              {needs.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-white/80"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-supp-red" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        )}

        {visibleSocialEmbeds.length > 0 && (
          <SocialMediaSection embeds={visibleSocialEmbeds} locale={locale} />
        )}

        <IdeaComments ideaId={idea.id} />
      </div>
    </article>
  );
}

function SocialMediaSection({
  embeds,
  locale,
}: {
  embeds: Idea["socialEmbeds"];
  locale: string;
}) {
  const t = useTranslations("idea");
  const zh = locale === "zh";

  return (
    <section className="rounded-2xl bg-black/70 p-4 backdrop-blur-sm">
      <h2 className="text-sm font-semibold text-white/90">{t("socialMedia")}</h2>
      <div className="mt-3 space-y-4">
        {embeds.map((embed, i) => {
          const title = (zh ? embed.titleZh : embed.title) || t("watchVideo");
          const src = resolveSocialEmbedSrc(embed);
          return (
            <div
              key={`${embed.platform}-${i}`}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
            >
              <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-supp-red/90 text-[9px] font-bold uppercase text-white">
                  {platformShort(embed.platform)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">
                    {t(`platforms.${embed.platform}`)}
                  </p>
                  <p className="truncate text-xs text-white/85">{title}</p>
                </div>
                <a
                  href={embed.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-[11px] font-medium text-white/55 underline-offset-2 hover:text-white hover:underline"
                >
                  {t("openOriginal")}
                </a>
              </div>

              {src ? (
                <div
                  className={`mx-auto w-full overflow-hidden bg-black ${socialEmbedAspect(embed.platform)}`}
                >
                  <iframe
                    src={src}
                    title={title}
                    className="h-full w-full border-0"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                </div>
              ) : (
                <a
                  href={embed.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 px-3 py-4 transition hover:bg-white/5"
                >
                  <p className="text-sm text-white/75">{t("watchOnPlatform", {
                    platform: t(`platforms.${embed.platform}`),
                  })}</p>
                  <span className="text-white/50">→</span>
                </a>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function platformShort(platform: Idea["socialEmbeds"][number]["platform"]) {
  if (platform === "tiktok") return "TT";
  if (platform === "instagram") return "IG";
  return "XHS";
}

function ShareOption({
  label,
  onClick,
  tone,
  children,
}: {
  label: string;
  onClick: () => void;
  tone: "neutral" | "green" | "dark" | "blue" | "sky" | "orange";
  children: React.ReactNode;
}) {
  const tones: Record<typeof tone, string> = {
    neutral: "bg-black/5 text-supp-ink",
    green: "bg-[#25D366]/15 text-[#128C7E]",
    dark: "bg-black text-white",
    blue: "bg-[#1877F2]/15 text-[#1877F2]",
    sky: "bg-[#2AABEE]/15 text-[#229ED9]",
    orange: "bg-[#E6162D]/12 text-[#E6162D]",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-2xl px-1 py-2 transition hover:bg-black/[0.03]"
    >
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-full text-lg ${tones[tone]}`}
      >
        {children}
      </span>
      <span className="text-center text-[10px] font-medium leading-tight text-supp-ink/80">
        {label}
      </span>
    </button>
  );
}

function CopyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M4 16V6a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.15 6.4 2.15 11.83c0 2.08.62 3.98 1.69 5.57L2 22l4.76-1.53a10 10 0 0 0 5.28 1.47c5.46 0 9.89-4.4 9.89-9.83C21.93 6.4 17.5 2 12.04 2zm5.5 13.95c-.23.66-1.35 1.22-1.88 1.3-.48.07-1.1.1-1.78-.11-.41-.13-.94-.3-1.62-.59-2.85-1.23-4.7-4.1-4.84-4.29-.14-.19-1.16-1.54-1.16-2.94s.73-2.08 1-2.36c.23-.28.61-.41.9-.41.1 0 .19 0 .27.01.24.01.36-.09.56.43.23.6.75 2.07.82 2.22.07.15.12.28.02.44-.1.18-.16.29-.32.45-.16.16-.32.33-.45.45-.15.13-.3.28-.13.55.17.28.76 1.25 1.63 2.02 1.12 1 2.06 1.31 2.36 1.45.28.13.45.11.62-.07.19-.2.8-.93 1.02-1.25.21-.32.43-.27.72-.16.3.11 1.88.89 2.2 1.05.32.16.54.24.62.37.08.15.08.83-.15 1.49z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.9 2H22l-6.8 7.78L23.3 22h-6.5l-5.1-6.66L5.9 22H2.8l7.28-8.32L.8 2h6.66l4.6 6.1L18.9 2zm-1.14 18h1.8L6.4 3.9H4.46L17.76 20z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.6l.4-3H13v-1.5c0-.6.4-1.1 1-1.1z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M21.5 3.6 2.9 10.8c-1.3.5-1.3 1.2-.2 1.5l4.7 1.5 1.8 5.6c.2.6.1.8.8.8.5 0 .7-.2 1-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8L22.8 5c.3-1.2-.4-1.7-1.3-1.4zM9.5 14.7l-.3 3.4 1.5-2.7 8.5-7.7-9.7 7z" />
    </svg>
  );
}

function WeiboIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10.4 16.8c-2.5.6-4.7-.7-4.9-2.9-.2-2.2 1.8-4.3 4.3-4.9 2.5-.6 4.7.7 4.9 2.9.2 2.2-1.8 4.3-4.3 4.9zm.4-6.2c-1.5.3-2.7 1.5-2.5 2.7.2 1.2 1.6 1.9 3.1 1.6 1.5-.3 2.7-1.5 2.5-2.7-.2-1.2-1.6-1.9-3.1-1.6zM17.8 11c-.3 0-.5.1-.5.3 0 .3.7.5 1.6.9.8.3 1.4.8 1.4 1.3 0 .9-1.6 1.6-3.6 1.6-2.9 0-5.2-1.4-5.2-3.1 0-1 .9-1.8 2.4-2.3.3-.1.2-.4-.1-.4-2.2.1-3.8 1.4-3.8 3 0 2.1 2.9 3.8 6.5 3.8 3.6 0 5.8-1.6 5.8-3.4 0-1.1-1.2-1.7-4.5-2.3zm1-5.1c.1-.4-.2-.7-.5-.5-.9.4-1.5 1.2-1.6 2.1-.1.4.3.7.6.5.8-.4 1.4-1.2 1.5-2.1zm2.7-.9c.2-.7-.3-1.4-1-1.1-1.9.7-3.2 2.4-3.5 4.3-.1.7.5 1.2 1.1.9 1.8-.8 3.1-2.6 3.4-4.1zM9.2 8.3c.4-.1.5-.5.2-.8C8.5 6.5 6.5 6.3 5 7c-.4.2-.3.7.1.8 1.4.4 3 .9 4.1.5z" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}

function ActionButton({
  icon,
  label,
  note,
  active,
  onClick,
  lit = "ink",
}: {
  icon: string;
  label: string;
  note?: string;
  active?: boolean;
  onClick?: () => void;
  lit?: "ink" | "red";
}) {
  const litText = lit === "red" ? "text-supp-red" : "text-supp-ink";
  const litRing =
    lit === "red"
      ? "border-supp-red bg-supp-red text-white shadow-[0_0_0_3px_rgba(227,27,35,0.2)]"
      : "border-black bg-black text-white shadow-[0_0_0_3px_rgba(0,0,0,0.12)]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col items-center gap-1.5 text-[11px] transition ${
        active ? litText : "text-black/55"
      }`}
    >
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-full border text-base transition ${
          active ? litRing : "border-black/15 bg-white"
        }`}
      >
        {icon}
      </span>
      <span className="font-medium">{label}</span>
      {note && (
        <span className="absolute -bottom-3.5 whitespace-nowrap text-[9px] text-supp-muted">
          {note}
        </span>
      )}
    </button>
  );
}
