"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { IdeaComments } from "@/components/IdeaComments";
import { hasMappableAddress } from "@/lib/map-address";
import {
  getExperiencedUsersForIdea,
  localizedIdea,
  mockUser,
  type Idea,
} from "@/data/mock-ideas";

export function IdeaDetailView({ idea }: { idea: Idea }) {
  const t = useTranslations("idea");
  const locale = useLocale();
  const L = localizedIdea(idea, locale);
  const [favorited, setFavorited] = useState(false);
  const [experienced, setExperienced] = useState(false);
  const zh = locale === "zh";

  const experiencedUsers = useMemo(() => {
    const base = getExperiencedUsersForIdea(idea.id);
    if (!experienced) return base;
    const self = {
      id: "self",
      name: mockUser.name,
      nameZh: mockUser.nameZh,
      avatar: mockUser.avatar,
    };
    return [self, ...base.filter((u) => u.avatar !== mockUser.avatar)];
  }, [idea.id, experienced]);

  const showMap = hasMappableAddress(idea);
  const [MapSnippet, setMapSnippet] = useState<React.ComponentType<{
    idea: Idea;
    locale: string;
  }> | null>(null);

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

        <div className="absolute inset-x-0 bottom-0 space-y-2 bg-black/55 px-4 py-4 backdrop-blur-[2px]">
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

      <div className="bg-white text-supp-ink">
        <div className="grid grid-cols-4 border-b border-black/8 py-3 text-center">
          <ActionButton
            active={experienced}
            onClick={() => setExperienced((v) => !v)}
            icon="✓"
            label={t("experienced")}
          />
          <ActionButton
            active={favorited}
            onClick={() => setFavorited((v) => !v)}
            icon="♥"
            label={t("favorite")}
            activeClass="text-supp-red"
          />
          <ActionButton icon="⤴" label={t("share")} />
          <ActionButton
            icon="¥"
            label={t("claim")}
            note={t("claimNote")}
          />
        </div>

        <p className="border-b border-black/8 px-4 py-2 text-xs text-supp-muted">
          {t("experienced")}: {idea.experiencedCount + (experienced ? 1 : 0)}
          <span className="mx-2">|</span>
          {t("favorite")}: {idea.favoritedCount + (favorited ? 1 : 0)}
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
              <div
                key={user.id}
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
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4 px-4 py-5">
        <div className="rounded-2xl bg-supp-red p-4 shadow-lg shadow-red-950/30 animate-fade-up">
          <p className="text-sm font-semibold">#{L.title}</p>
          <p className="mt-3 text-[15px] leading-relaxed text-white/95">
            “{L.tip}”
          </p>
          <div className="mt-4 flex items-center gap-2">
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
          </div>
        </div>

        <section className="rounded-2xl bg-white/5 p-4">
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
            <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
              <div className="h-40 w-full">
                <MapSnippet idea={idea} locale={locale} />
              </div>
              <p className="border-t border-white/10 bg-black/30 px-3 py-2 text-[11px] text-white/60">
                {L.address}
              </p>
            </div>
          )}
        </section>

        <IdeaComments ideaId={idea.id} />

        <Link
          href="/map"
          className="mb-8 flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm font-medium text-supp-ink"
        >
          <span>{t("openOnMap")}</span>
          <span>→</span>
        </Link>
      </div>
    </article>
  );
}

function ActionButton({
  icon,
  label,
  note,
  active,
  onClick,
  activeClass = "text-black",
}: {
  icon: string;
  label: string;
  note?: string;
  active?: boolean;
  onClick?: () => void;
  activeClass?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col items-center gap-1 text-[11px] ${
        active ? activeClass : "text-black/70"
      }`}
    >
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-full border text-base ${
          active ? "border-current bg-black text-white" : "border-black/20"
        }`}
      >
        {icon}
      </span>
      <span>{label}</span>
      {note && (
        <span className="absolute -bottom-3 whitespace-nowrap text-[9px] text-supp-muted">
          {note}
        </span>
      )}
    </button>
  );
}
