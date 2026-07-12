"use client";

import Image from "next/image";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { localizedIdea, type Idea } from "@/data/mock-ideas";

export function IdeaDetailView({ idea }: { idea: Idea }) {
  const t = useTranslations("idea");
  const locale = useLocale();
  const L = localizedIdea(idea, locale);
  const [favorited, setFavorited] = useState(false);
  const [experienced, setExperienced] = useState(false);

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
        </section>

        <section className="rounded-2xl bg-white/5 p-4">
          <h2 className="text-sm font-semibold">{t("comments")}</h2>
          <div className="mt-3 space-y-3">
            <Comment
              name={locale === "zh" ? "史蒂芬的未具名基友" : "Stephen's unnamed buddy"}
              body={
                locale === "zh"
                  ? "试过一次，真的会被旁边的对话吸住注意力。"
                  : "Tried it once — the nearby chatter really pulls you in."
              }
            />
            <Comment
              name={locale === "zh" ? "米拉" : "Mira"}
              body={
                locale === "zh"
                  ? "记得假装看手机，不然很容易穿帮。"
                  : "Pretend to check your phone or you'll get caught."
              }
            />
          </div>
          <button
            type="button"
            className="mt-4 w-full rounded-xl border border-white/15 py-2.5 text-sm text-white/80"
          >
            {t("writeComment")}
          </button>
        </section>

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

function Comment({ name, body }: { name: string; body: string }) {
  return (
    <div className="rounded-xl bg-black/25 px-3 py-2.5">
      <p className="text-xs font-medium text-white/90">{name}</p>
      <p className="mt-1 text-sm leading-relaxed text-white/65">{body}</p>
    </div>
  );
}
