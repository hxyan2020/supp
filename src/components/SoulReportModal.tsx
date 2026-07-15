"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toPng } from "html-to-image";
import QRCode from "qrcode";
import { localizedIdea, type Idea } from "@/data/mock-ideas";
import { UserAvatar } from "@/components/UserAvatar";
import { DEFAULT_AVATAR } from "@/lib/avatar";

export type SoulReportUser = {
  id: string;
  nickname: string;
  avatar: string;
  experienced: number;
  favorited: number;
  percentile: number;
  personaUnlocked: boolean;
  personaAvatar: string | null;
  persona: string;
  personaZh: string;
  personaDesc: string;
  personaDescZh: string;
};

export type SoulReportSimilar = {
  id: string;
  nickname: string;
  nicknameZh: string;
  avatar: string;
  persona: string;
  personaZh: string;
  overlapCount: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  user: SoulReportUser;
  collectedIdeas: Idea[];
  experiencedByMonth: [string, Idea[]][];
  similar: SoulReportSimilar[];
  monthLabel: (key: string) => string;
};

export function SoulReportModal({
  open,
  onClose,
  user,
  collectedIdeas,
  experiencedByMonth,
  similar,
  monthLabel,
}: Props) {
  const t = useTranslations("me");
  const tBrand = useTranslations("brand");
  const locale = useLocale();
  const zh = locale === "zh";
  const cardRef = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/${locale}/users/${user.id}`;
  }, [locale, user.id]);

  const personaName = zh
    ? user.personaZh || user.persona
    : user.persona;
  const personaDesc = zh
    ? user.personaDescZh || user.personaDesc
    : user.personaDesc;

  const collectedShow = collectedIdeas.slice(0, 6);
  const experiencedFlat = experiencedByMonth.flatMap(([month, ideas]) =>
    ideas.map((idea) => ({ month, idea })),
  );
  const experiencedShow = experiencedFlat.slice(0, 8);
  const similarShow = similar.slice(0, 5);
  const hasActivity =
    user.experienced > 0 ||
    user.favorited > 0 ||
    collectedShow.length > 0 ||
    experiencedShow.length > 0;

  useEffect(() => {
    if (!open || !shareUrl) return;
    let cancelled = false;
    void QRCode.toDataURL(shareUrl, {
      width: 220,
      margin: 1,
      color: { dark: "#111111", light: "#ffffff" },
      errorCorrectionLevel: "M",
    }).then((url) => {
      if (!cancelled) setQrDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [open, shareUrl]);

  useEffect(() => {
    if (!open) {
      setPreviewUrl("");
      setError("");
      setReady(false);
      setBusy(false);
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !hasActivity || !qrDataUrl || busy || previewUrl) return;
    const timer = window.setTimeout(() => {
      void generate();
    }, 350);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, qrDataUrl, hasActivity]);

  async function waitForImages(node: HTMLElement) {
    const imgs = Array.from(node.querySelectorAll("img"));
    await Promise.all(
      imgs.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete && img.naturalWidth > 0) {
              resolve();
              return;
            }
            const done = () => resolve();
            img.addEventListener("load", done, { once: true });
            img.addEventListener("error", done, { once: true });
            window.setTimeout(done, 2500);
          }),
      ),
    );
  }

  async function generate() {
    const node = cardRef.current;
    if (!node || busy) return;
    setBusy(true);
    setError("");
    try {
      await waitForImages(node);
      // Let layout settle
      await new Promise((r) => window.setTimeout(r, 80));
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#1a1024",
        filter: (el) => {
          if (!(el instanceof HTMLElement)) return true;
          return !el.dataset.ignoreCapture;
        },
      });
      setPreviewUrl(dataUrl);
      setReady(true);
    } catch {
      setError(t("soulReportFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function download() {
    const url = previewUrl || (await regenerate());
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `supp-soul-report-${user.nickname || user.id}.png`;
    a.click();
  }

  async function regenerate() {
    const node = cardRef.current;
    if (!node) return "";
    setBusy(true);
    try {
      await waitForImages(node);
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#1a1024",
      });
      setPreviewUrl(dataUrl);
      setReady(true);
      return dataUrl;
    } catch {
      setError(t("soulReportFailed"));
      return "";
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    const url = previewUrl || (await regenerate());
    if (!url) return;
    try {
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], "supp-soul-report.png", {
        type: "image/png",
      });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: t("soulReportTitle"),
          text: t("soulReportShareText", { name: user.nickname }),
        });
        return;
      }
    } catch {
      // fall through to download
    }
    await download();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label={t("soulReportClose")}
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-[#141414] text-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div>
            <p className="font-display text-sm font-extrabold tracking-tight">
              {t("soulReportTitle")}
            </p>
            <p className="text-[11px] text-white/50">{t("soulReportHint")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-lg"
            aria-label={t("soulReportClose")}
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {!hasActivity ? (
            <div className="mx-auto max-w-[360px] rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-6 text-center">
              <p className="text-sm font-semibold text-amber-50">
                {t("soulReportNeedActivityTitle")}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-white/70">
                {t("soulReportNeedActivity")}
              </p>
            </div>
          ) : (
            <>
              {busy && !previewUrl && (
                <p className="mb-3 text-center text-xs text-white/60">
                  {t("soulReportGenerating")}
                </p>
              )}
              {error && (
                <p className="mb-3 rounded-xl border border-red-400/30 bg-red-500/15 px-3 py-2 text-xs text-red-100">
                  {error}
                </p>
              )}

              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt=""
                  className="mx-auto w-full max-w-[360px] rounded-2xl border border-white/10 shadow-xl"
                />
              ) : (
                <div className="mx-auto flex h-[420px] max-w-[360px] items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03]">
                  <p className="px-6 text-center text-xs text-white/45">
                    {busy ? t("soulReportGenerating") : t("soulReportHint")}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Capture source — always mounted at full size offscreen */}
        {hasActivity && (
          <div
            aria-hidden
            className="pointer-events-none fixed -left-[9999px] top-0 z-[-1]"
          >
            <ReportCard
              cardRef={cardRef}
              user={user}
              zh={zh}
              t={t}
              tBrand={tBrand}
              locale={locale}
              personaName={personaName}
              personaDesc={personaDesc}
              collectedShow={collectedShow}
              experiencedShow={experiencedShow}
              similarShow={similarShow}
              monthLabel={monthLabel}
              qrDataUrl={qrDataUrl}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 border-t border-white/10 p-4">
          <button
            type="button"
            disabled={busy || !ready || !hasActivity}
            onClick={() => void download()}
            className="rounded-xl border border-white/15 py-3 text-sm font-semibold text-white/90 disabled:opacity-40"
          >
            {t("soulReportDownload")}
          </button>
          <button
            type="button"
            disabled={busy || !ready || !hasActivity}
            onClick={() => void share()}
            className="rounded-xl bg-supp-red py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            {t("soulReportShare")}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReportCard({
  cardRef,
  user,
  zh,
  t,
  tBrand,
  locale,
  personaName,
  personaDesc,
  collectedShow,
  experiencedShow,
  similarShow,
  monthLabel,
  qrDataUrl,
}: {
  cardRef: React.RefObject<HTMLDivElement | null>;
  user: SoulReportUser;
  zh: boolean;
  t: (key: string, values?: Record<string, string | number>) => string;
  tBrand: (key: string) => string;
  locale: string;
  personaName: string;
  personaDesc: string;
  collectedShow: Idea[];
  experiencedShow: { month: string; idea: Idea }[];
  similarShow: SoulReportSimilar[];
  monthLabel: (key: string) => string;
  qrDataUrl: string;
}) {
  return (
    <div
      ref={cardRef}
      className="relative w-[720px] overflow-hidden text-white"
      style={{
        fontFamily:
          'var(--font-noto-sans), "Noto Sans SC", "PingFang SC", sans-serif',
        background:
          "linear-gradient(165deg, #2a1030 0%, #1a1a48 28%, #0f2a3a 58%, #1a1820 100%)",
      }}
    >
      {/* Atmosphere — colorful washes */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse 90% 45% at 8% -5%, rgba(227,27,35,0.55), transparent 55%)",
            "radial-gradient(ellipse 70% 40% at 95% 8%, rgba(255,140,50,0.38), transparent 52%)",
            "radial-gradient(ellipse 65% 45% at 50% 45%, rgba(40,200,190,0.28), transparent 55%)",
            "radial-gradient(ellipse 55% 35% at 85% 85%, rgba(255,70,140,0.32), transparent 50%)",
            "radial-gradient(ellipse 50% 30% at 10% 90%, rgba(90,120,255,0.28), transparent 48%)",
          ].join(", "),
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative px-10 pb-10 pt-12">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#ff6b6b]"
          style={{ fontFamily: "var(--font-syne), Syne, sans-serif" }}
        >
          {t("soulReportEyebrow")}
        </p>
        <h1
          className="mt-3 text-[42px] font-extrabold leading-[1.05] tracking-tight"
          style={{ fontFamily: "var(--font-syne), Syne, sans-serif" }}
        >
          {t("soulReportHeadline")}
        </h1>
        <p className="mt-2 text-[15px] text-white/70">{t("soulReportSub")}</p>

        {/* Profile */}
        <div className="mt-10 flex items-center gap-5">
          <div className="h-[88px] w-[88px] shrink-0 overflow-hidden rounded-full border-2 border-white/35 bg-white/10 shadow-[0_0_24px_rgba(255,100,80,0.35)]">
            <UserAvatar
              src={user.avatar || DEFAULT_AVATAR}
              crossOrigin="anonymous"
            />
          </div>
          <div className="min-w-0">
            <p
              className="truncate text-[28px] font-bold tracking-tight"
              style={{ fontFamily: "var(--font-syne), Syne, sans-serif" }}
            >
              {user.nickname}
            </p>
            <p className="mt-1 text-[13px] text-white/55">
              {t("userIdLabel", { id: user.id.slice(0, 12) })}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          <StatBlock label={t("experienced")} value={String(user.experienced)} />
          <StatBlock label={t("collected")} value={String(user.favorited)} />
          <StatBlock
            label={t("soulReportPercentileLabel")}
            value={`${user.percentile}%`}
          />
        </div>

        <p className="mt-6 text-[16px] leading-relaxed text-white/80">
          {t("summaryLead")}{" "}
          {t("summaryExperienced", { count: user.experienced })} ·{" "}
          {t("summarySaved", { count: user.favorited })} ·{" "}
          {t("summaryPercentile", { pct: user.percentile })}
        </p>
        <p
          className="mt-3 text-[28px] leading-snug tracking-wide text-white/85"
          style={{
            fontFamily: zh
              ? 'var(--font-ma-shan), "Ma Shan Zheng", cursive'
              : 'var(--font-caveat), Caveat, cursive',
          }}
        >
          {t("summaryQuote")}
        </p>

        {/* Persona */}
        <section className="mt-10 overflow-hidden rounded-3xl border border-white/15 bg-white/[0.08] p-6 shadow-[0_8px_40px_rgba(0,0,0,0.25)]">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white/10">
              {user.personaUnlocked && user.personaAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.personaAvatar}
                  alt=""
                  crossOrigin="anonymous"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl text-white/30">
                  ?
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              {user.personaUnlocked && personaName ? (
                <>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#ff8a65]">
                    {t("soulReportPersonaLabel")}
                  </p>
                  <p
                    className="mt-1 text-[22px] font-bold"
                    style={{ fontFamily: "var(--font-syne), Syne, sans-serif" }}
                  >
                    {t("personaTitle", { persona: personaName })}
                  </p>
                  <p className="mt-2 text-[14px] leading-relaxed text-white/70">
                    {personaDesc}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[18px] font-semibold">
                    {t("personaLockedTitle")}
                  </p>
                  <p className="mt-2 text-[14px] text-white/60">
                    {t("personaLockedDesc")}
                  </p>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Collected — omit section when empty */}
        {collectedShow.length > 0 && (
          <section className="mt-10">
            <SectionHead
              title={t("collectedTitle")}
              count={t("collectedCount", { count: user.favorited })}
            />
            <div className="mt-4 grid grid-cols-2 gap-3">
              {collectedShow.map((idea) => (
                <IdeaTile
                  key={idea.id}
                  idea={idea}
                  locale={locale}
                  badge={t("collected")}
                />
              ))}
            </div>
          </section>
        )}

        {/* Experienced — omit section when empty */}
        {experiencedShow.length > 0 && (
          <section className="mt-10">
            <SectionHead
              title={t("experiencedTitle")}
              count={t("experiencedCountLabel", {
                count: user.experienced,
              })}
            />
            <div className="mt-4 space-y-4">
              {groupByMonth(experiencedShow).map(([month, items]) => (
                <div key={month}>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">
                    {monthLabel(month)}
                  </p>
                  <div className="space-y-2">
                    {items.map(({ idea }) => {
                      const L = localizedIdea(idea, locale);
                      return (
                        <div
                          key={idea.id}
                          className="flex items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.07] p-2"
                        >
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={idea.image}
                              alt=""
                              crossOrigin="anonymous"
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <p className="min-w-0 flex-1 truncate text-[14px] font-medium text-white/90">
                            {L.title}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Similar souls — only when there are matches */}
        {similarShow.length > 0 && (
          <section className="mt-10">
            <SectionHead title={t("friendsTitle")} count="" />
            <p className="mt-1 text-[13px] text-white/55">{t("friendsSub")}</p>
            <div className="mt-4 space-y-3">
              {similarShow.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.07] px-3 py-2.5"
                >
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-white/10">
                    <UserAvatar src={friend.avatar} crossOrigin="anonymous" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold">
                      {zh
                        ? friend.nicknameZh || friend.nickname
                        : friend.nickname}
                    </p>
                    <p className="truncate text-[12px] text-white/50">
                      {zh
                        ? friend.personaZh || friend.persona
                        : friend.persona}{" "}
                      · {t("overlapCount", { count: friend.overlapCount })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer: logo + QR */}
        <footer className="mt-12 flex items-end justify-between gap-6 border-t border-white/15 pt-8">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.jpg"
                alt=""
                crossOrigin="anonymous"
                className="h-12 w-12 rounded-md object-cover"
              />
              <div>
                <p
                  className="text-[28px] font-semibold leading-none tracking-normal"
                  style={{
                    fontFamily: zh
                      ? 'var(--font-ma-shan), "Ma Shan Zheng", cursive'
                      : 'var(--font-caveat), Caveat, cursive',
                  }}
                >
                  {tBrand("name")}
                </p>
                <p className="mt-1 text-[12px] text-white/55">
                  {tBrand("tagline")}
                </p>
              </div>
            </div>
            <p className="mt-4 max-w-[320px] text-[13px] leading-relaxed text-white/50">
              {t("soulReportFooter")}
            </p>
          </div>
          <div className="shrink-0 text-center">
            <div className="overflow-hidden rounded-2xl bg-white p-2">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="" className="h-[120px] w-[120px]" />
              ) : (
                <div className="h-[120px] w-[120px] animate-pulse bg-neutral-200" />
              )}
            </div>
            <p className="mt-2 text-[11px] font-medium tracking-wide text-white/55">
              {t("soulReportScan")}
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-gradient-to-br from-white/[0.14] to-white/[0.04] px-3 py-4 text-center shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
      <p
        className="text-[28px] font-extrabold tracking-tight text-white"
        style={{ fontFamily: "var(--font-syne), Syne, sans-serif" }}
      >
        {value}
      </p>
      <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-white/55">
        {label}
      </p>
    </div>
  );
}

function SectionHead({ title, count }: { title: string; count: string }) {
  return (
    <div className="flex items-end justify-between gap-3 border-b border-white/10 pb-2">
      <h2
        className="text-[20px] font-bold tracking-tight"
        style={{ fontFamily: "var(--font-syne), Syne, sans-serif" }}
      >
        {title}
      </h2>
      {count ? (
        <p className="text-[12px] font-semibold text-[#e31b23]">{count}</p>
      ) : null}
    </div>
  );
}

function IdeaTile({
  idea,
  locale,
  badge,
}: {
  idea: Idea;
  locale: string;
  badge: string;
}) {
  const L = localizedIdea(idea, locale);
  return (
    <div className="relative h-[148px] overflow-hidden rounded-2xl">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={idea.image}
        alt=""
        crossOrigin="anonymous"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-3">
        <p className="line-clamp-2 text-[14px] font-semibold leading-snug text-white">
          {L.title}
        </p>
        <p className="mt-1 text-[10px] uppercase tracking-wide text-white/55">
          {badge}
        </p>
      </div>
    </div>
  );
}

function groupByMonth(
  items: { month: string; idea: Idea }[],
): [string, { month: string; idea: Idea }[]][] {
  const map = new Map<string, { month: string; idea: Idea }[]>();
  for (const item of items) {
    const list = map.get(item.month) ?? [];
    list.push(item);
    map.set(item.month, list);
  }
  return [...map.entries()];
}
