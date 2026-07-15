"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { IdeaComments } from "@/components/IdeaComments";
import { hasMappableAddress, navigationUrl } from "@/lib/map-address";
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
  const [claimed, setClaimed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [me, setMe] = useState<MeLite | null>(null);
  const [toast, setToast] = useState("");
  const zh = locale === "zh";

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

  async function onShare() {
    const url =
      typeof window !== "undefined"
        ? window.location.href
        : `/ideas/${idea.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: L.title,
          text: L.summary,
          url,
        });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      }
      setShared(true);
      showToast(t("toastShared"));
    } catch {
      // user cancelled share sheet
    }
  }

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
      <div className="relative h-[48vh] min-h-[280px]">
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
            <span className="mx-2 text-white/40">·</span>
            {t("sensation")}: {L.sensation}
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
            onClick={() => void onShare()}
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
                  <Image
                    src={user.avatar}
                    alt={zh ? user.nameZh : user.name}
                    fill
                    className="object-cover"
                    sizes="44px"
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

      {toast && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-md animate-fade-up rounded-2xl bg-black/90 px-4 py-3 text-center text-sm font-medium text-white shadow-xl backdrop-blur-sm"
        >
          {toast}
        </div>
      )}

      <div className="space-y-4 px-4 pb-8 pt-5">
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
                  <Image
                    src={idea.organizerAvatar}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="32px"
                  />
                </div>
                <p className="text-xs text-white/85">
                  {t("claimedBy", { name: L.organizer })}
                </p>
              </Link>
            ) : (
              <>
                <div className="relative h-8 w-8 overflow-hidden rounded-full border border-white/40">
                  <Image
                    src={idea.organizerAvatar}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="32px"
                  />
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

        <section className="rounded-2xl bg-black/70 p-4 backdrop-blur-sm">
          <h2 className="text-sm font-semibold text-white/90">{t("steps")}</h2>
          {steps.length === 0 ? (
            <p className="mt-2 text-sm text-white/45">{t("stepsEmpty")}</p>
          ) : (
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
          )}
        </section>

        <section className="rounded-2xl bg-black/70 p-4 backdrop-blur-sm">
          <h2 className="text-sm font-semibold text-white/90">{t("whatYouNeed")}</h2>
          {needs.length === 0 ? (
            <p className="mt-2 text-sm text-white/45">{t("needsEmpty")}</p>
          ) : (
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
          )}
        </section>

        <SocialMediaSection embeds={visibleSocialEmbeds} locale={locale} />

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
      {embeds.length === 0 ? (
        <p className="mt-2 text-sm text-white/45">{t("socialEmpty")}</p>
      ) : (
        <div className="mt-3 space-y-3">
          {embeds.map((embed, i) => (
            <a
              key={`${embed.platform}-${i}`}
              href={embed.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 transition hover:bg-white/10"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-supp-red/90 text-[10px] font-bold uppercase text-white">
                {platformShort(embed.platform)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/45">
                  {t(`platforms.${embed.platform}`)}
                </p>
                <p className="truncate text-sm text-white/90">
                  {(zh ? embed.titleZh : embed.title) || t("watchVideo")}
                </p>
              </div>
              <span className="text-white/50">→</span>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

function platformShort(platform: Idea["socialEmbeds"][number]["platform"]) {
  if (platform === "tiktok") return "TT";
  if (platform === "instagram") return "IG";
  return "XHS";
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
