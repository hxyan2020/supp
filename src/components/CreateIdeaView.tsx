"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import type { Category, Sensation } from "@/data/mock-ideas";

const CATEGORIES: Category[] = [
  "comfort",
  "taste",
  "outdoors",
  "creative",
  "social",
  "culture",
  "adrenaline",
  "wellness",
];

const SENSATIONS: Sensation[] = ["calm", "curious", "stimulating", "intense"];

type MatchIdea = {
  id: string;
  title: string;
  summary: string;
  image: string;
  city: string;
  published: boolean;
};

type DraftState = {
  id?: string;
  title: string;
  summary: string;
  description: string;
  tip: string;
  location: string;
  address: string;
  city: string;
  country: string;
  date: string;
  durationMin: number;
  fee: number;
  weather: "any" | "sunny" | "cloudy" | "rainy";
  categories: Category[];
  sensation: Sensation;
  stepsText: string;
  needsText: string;
  image: string;
  imageUploaded: boolean;
};

const emptyDraft = (): DraftState => ({
  title: "",
  summary: "",
  description: "",
  tip: "",
  location: "",
  address: "",
  city: "Hong Kong",
  country: "China",
  date: "Anytime",
  durationMin: 60,
  fee: 0,
  weather: "any",
  categories: ["social"],
  sensation: "curious",
  stepsText: "",
  needsText: "",
  image: "",
  imageUploaded: false,
});

type StepId =
  | "basics"
  | "story"
  | "place"
  | "details"
  | "vibe"
  | "howto"
  | "cover"
  | "terms";

/** 7 content steps + final terms agreement */
const STEPS: StepId[] = [
  "basics",
  "story",
  "place",
  "details",
  "vibe",
  "howto",
  "cover",
  "terms",
];

const TERMS_PATH = "/terms";

const WEATHER_OPTIONS = ["any", "sunny", "cloudy", "rainy"] as const;

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none placeholder:text-white/35 focus:border-supp-red";

export function CreateIdeaView() {
  const t = useTranslations("createIdea");
  const tExplore = useTranslations("explore");
  const locale = useLocale();
  const zh = locale === "zh";
  const router = useRouter();

  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<DraftState>(emptyDraft);
  const [matches, setMatches] = useState<MatchIdea[]>([]);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<number | null>(null);

  const stepId = STEPS[stepIndex]!;
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  function patch(p: Partial<DraftState>) {
    setDraft((d) => ({ ...d, ...p }));
  }

  useEffect(() => {
    if (stepId !== "basics") return;
    const q = draft.title.trim();
    if (q.length < 2) {
      setMatches([]);
      return;
    }
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => {
      setSearching(true);
      void fetch(
        `/api/ideas/title-search?q=${encodeURIComponent(q)}&locale=${encodeURIComponent(locale)}${
          draft.id ? `&excludeId=${encodeURIComponent(draft.id)}` : ""
        }`,
      )
        .then((r) => r.json())
        .then((data) => setMatches(data.ideas || []))
        .catch(() => setMatches([]))
        .finally(() => setSearching(false));
    }, 320);
    return () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current);
    };
  }, [draft.title, draft.id, locale, stepId]);

  async function persist(action: "save_draft" | "submit") {
    setBusy(true);
    setError("");
    try {
      const payload = {
        id: draft.id,
        action,
        title: draft.title.trim(),
        titleZh: draft.title.trim(),
        summary: draft.summary.trim(),
        summaryZh: draft.summary.trim(),
        description: draft.description.trim(),
        descriptionZh: draft.description.trim(),
        tip: draft.tip.trim(),
        tipZh: draft.tip.trim(),
        location: draft.location.trim(),
        locationZh: draft.location.trim(),
        address: draft.address.trim(),
        addressZh: draft.address.trim(),
        city: draft.city.trim(),
        country: draft.country.trim(),
        date: draft.date.trim() || "Anytime",
        durationMin: draft.durationMin,
        fee: draft.fee,
        weather: draft.weather,
        categories: draft.categories,
        sensation: draft.sensation,
        steps: draft.stepsText
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean),
        needs: draft.needsText
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean),
        image: draft.image || undefined,
        imageUploaded: draft.imageUploaded,
      };

      const res = await fetch("/api/ideas/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.idea?.id) {
        patch({
          id: data.idea.id,
          image: data.idea.image || draft.image,
        });
      }

      if (res.status === 422 || data.code === "blocked") {
        setError(zh ? data.reasonZh || t("blocked") : data.reason || t("blocked"));
        return { ok: false as const, status: "rejected" as const };
      }
      if (!res.ok) {
        setError(data.error || t("saveFailed"));
        return { ok: false as const, status: "error" as const };
      }

      if (action === "submit") {
        setToast(t("published"));
        window.setTimeout(() => {
          router.push(`/ideas/${data.idea.id}`);
        }, 700);
        return { ok: true as const, status: "published" as const };
      }

      setToast(t("draftSaved"));
      window.setTimeout(() => setToast(""), 1800);
      return { ok: true as const, status: "draft" as const };
    } catch {
      setError(t("saveFailed"));
      return { ok: false as const, status: "error" as const };
    } finally {
      setBusy(false);
    }
  }

  async function onNext() {
    setError("");
    if (stepId === "basics" && !draft.title.trim()) {
      setError(t("titleRequired"));
      return;
    }
    if (stepId === "story" && !draft.description.trim()) {
      setError(t("descriptionRequired"));
      return;
    }
    if (stepId === "terms" && !termsAccepted) {
      setError(t("termsRequired"));
      return;
    }
    // Autosave draft after title is known
    if (draft.title.trim() && stepId !== "terms") {
      await persist("save_draft");
    }
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((i) => i + 1);
    }
  }

  async function onSubmit() {
    setError("");
    if (!termsAccepted) {
      setError(t("termsRequired"));
      return;
    }
    await persist("submit");
  }

  function onBack() {
    setError("");
    if (stepIndex === 0) {
      router.push("/explore");
      return;
    }
    setStepIndex((i) => i - 1);
  }

  async function runAi(field: "description" | "steps") {
    if (!draft.title.trim()) {
      setError(t("titleRequired"));
      return;
    }
    setAiBusy(true);
    setError("");
    try {
      const res = await fetch("/api/ideas/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field,
          title: draft.title,
          summary: draft.summary,
          location: draft.location,
          locale,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          zh ? data.reasonZh || data.error || t("aiFailed") : data.reason || data.error || t("aiFailed"),
        );
        return;
      }
      if (field === "description" && data.text) {
        patch({ description: data.text });
      }
      if (field === "steps" && Array.isArray(data.steps)) {
        patch({ stepsText: data.steps.join("\n") });
      }
    } catch {
      setError(t("aiFailed"));
    } finally {
      setAiBusy(false);
    }
  }

  async function onPickCover(file: File | null) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/ideas/upload-image", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          zh ? data.reasonZh || data.error || t("uploadFailed") : data.reason || data.error || t("uploadFailed"),
        );
        return;
      }
      patch({ image: data.url, imageUploaded: true });
    } catch {
      setError(t("uploadFailed"));
    } finally {
      setBusy(false);
    }
  }

  const stepTitle = t(`steps.${stepId}.title`);
  const stepHint = t(`steps.${stepId}.hint`);

  return (
    <div className="min-h-full bg-[#2a2a2a] text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/80 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg"
            aria-label={t("back")}
          >
            ←
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-sm font-semibold">{t("pageTitle")}</p>
            <p className="text-[11px] text-white/45">
              {t("stepOf", { current: stepIndex + 1, total: STEPS.length })}
            </p>
          </div>
          <button
            type="button"
            disabled={busy || !draft.title.trim()}
            onClick={() => void persist("save_draft")}
            className="rounded-full px-2.5 py-1 text-[11px] font-medium text-white/70 disabled:opacity-40"
          >
            {t("saveDraft")}
          </button>
        </div>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-supp-red transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <div className="space-y-4 px-4 pb-28 pt-5">
        <section className="rounded-2xl bg-black/70 p-4 backdrop-blur-sm">
          <h1 className="text-lg font-semibold tracking-tight">{stepTitle}</h1>
          <p className="mt-1 text-sm text-white/55">{stepHint}</p>

          <div className="relative mt-4 space-y-3">
            {stepId === "basics" && (
              <>
                <div>
                  <FieldLabel>{t("fieldTitle")}</FieldLabel>
                  <input
                    value={draft.title}
                    onChange={(e) => patch({ title: e.target.value })}
                    placeholder={t("placeholders.title")}
                    className={inputClass}
                    autoFocus
                  />
                </div>
                <div>
                  <FieldLabel>{t("fieldSummary")}</FieldLabel>
                  <input
                    value={draft.summary}
                    onChange={(e) => patch({ summary: e.target.value })}
                    placeholder={t("placeholders.summary")}
                    className={inputClass}
                  />
                </div>
              </>
            )}

            {stepId === "story" && (
              <>
                <div className="relative">
                  <FieldLabel>{t("fieldDescription")}</FieldLabel>
                  <textarea
                    value={draft.description}
                    onChange={(e) => patch({ description: e.target.value })}
                    rows={7}
                    placeholder={t("placeholders.description")}
                    className={`${inputClass} resize-none pb-12`}
                    autoFocus
                  />
                  <AiCornerButton
                    label={t("aiGenerate")}
                    busy={aiBusy}
                    onClick={() => void runAi("description")}
                  />
                </div>
                <div>
                  <FieldLabel>{t("fieldTip")}</FieldLabel>
                  <textarea
                    value={draft.tip}
                    onChange={(e) => patch({ tip: e.target.value })}
                    rows={4}
                    placeholder={t("placeholders.tip")}
                    className={`${inputClass} resize-none`}
                  />
                </div>
              </>
            )}

            {stepId === "place" && (
              <>
                <div>
                  <FieldLabel>{t("fieldLocation")}</FieldLabel>
                  <input
                    value={draft.location}
                    onChange={(e) => patch({ location: e.target.value })}
                    placeholder={t("placeholders.location")}
                    className={inputClass}
                    autoFocus
                  />
                </div>
                <div>
                  <FieldLabel>{t("fieldAddress")}</FieldLabel>
                  <input
                    value={draft.address}
                    onChange={(e) => patch({ address: e.target.value })}
                    placeholder={t("placeholders.address")}
                    className={inputClass}
                  />
                </div>
                <div>
                  <FieldLabel>{t("fieldCity")}</FieldLabel>
                  <input
                    value={draft.city}
                    onChange={(e) => patch({ city: e.target.value })}
                    placeholder={t("placeholders.city")}
                    className={inputClass}
                  />
                </div>
                <div>
                  <FieldLabel>{t("fieldCountry")}</FieldLabel>
                  <input
                    value={draft.country}
                    onChange={(e) => patch({ country: e.target.value })}
                    placeholder={t("placeholders.country")}
                    className={inputClass}
                  />
                </div>
              </>
            )}

            {stepId === "details" && (
              <>
                <div>
                  <FieldLabel>{t("fieldWhen")}</FieldLabel>
                  <input
                    value={draft.date}
                    onChange={(e) => patch({ date: e.target.value })}
                    placeholder={t("placeholders.when")}
                    className={inputClass}
                    autoFocus
                  />
                </div>
                <div>
                  <FieldLabel>{t("fieldDuration")}</FieldLabel>
                  <input
                    type="number"
                    min={5}
                    max={1440}
                    value={draft.durationMin}
                    onChange={(e) =>
                      patch({ durationMin: Number(e.target.value) || 60 })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <FieldLabel>{t("fieldFee")}</FieldLabel>
                  <input
                    type="number"
                    min={0}
                    value={draft.fee}
                    onChange={(e) => patch({ fee: Number(e.target.value) || 0 })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <FieldLabel>{t("fieldWeather")}</FieldLabel>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {WEATHER_OPTIONS.map((w) => {
                      const on = draft.weather === w;
                      return (
                        <button
                          key={w}
                          type="button"
                          onClick={() => patch({ weather: w })}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                            on
                              ? "bg-supp-red text-white"
                              : "bg-white/10 text-white/70"
                          }`}
                        >
                          {tExplore(`weatherOptions.${w}`)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {stepId === "vibe" && (
              <>
                <div>
                  <FieldLabel>{t("fieldCategories")}</FieldLabel>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => {
                      const on = draft.categories.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            const next = on
                              ? draft.categories.filter((c) => c !== cat)
                              : [...draft.categories, cat];
                            patch({
                              categories: next.length ? next : ["social"],
                            });
                          }}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                            on
                              ? "bg-supp-red text-white"
                              : "bg-white/10 text-white/70"
                          }`}
                        >
                          {tExplore(`categories.${cat}`)}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <FieldLabel>{t("fieldSensation")}</FieldLabel>
                  <div className="mt-1.5 grid grid-cols-2 gap-2">
                    {SENSATIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => patch({ sensation: s })}
                        className={`rounded-xl border px-3 py-3 text-sm ${
                          draft.sensation === s
                            ? "border-supp-red bg-supp-red/20 text-white"
                            : "border-white/10 bg-black/30 text-white/70"
                        }`}
                      >
                        {t(`sensations.${s}`)}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {stepId === "howto" && (
              <>
                <div className="relative">
                  <FieldLabel>{t("fieldSteps")}</FieldLabel>
                  <textarea
                    value={draft.stepsText}
                    onChange={(e) => patch({ stepsText: e.target.value })}
                    rows={7}
                    placeholder={t("placeholders.steps")}
                    className={`${inputClass} resize-none pb-12`}
                    autoFocus
                  />
                  <AiCornerButton
                    label={t("aiGenerate")}
                    busy={aiBusy}
                    onClick={() => void runAi("steps")}
                  />
                </div>
                <div>
                  <FieldLabel>{t("fieldNeeds")}</FieldLabel>
                  <textarea
                    value={draft.needsText}
                    onChange={(e) => patch({ needsText: e.target.value })}
                    rows={5}
                    placeholder={t("placeholders.needs")}
                    className={`${inputClass} resize-none`}
                  />
                </div>
              </>
            )}

            {stepId === "cover" && (
              <div className="space-y-3">
                <p className="text-xs text-white/50">{t("coverHint")}</p>
                {draft.image ? (
                  <div className="relative h-40 overflow-hidden rounded-2xl border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={draft.image}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <p className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white/80">
                      {draft.imageUploaded
                        ? t("coverUploaded")
                        : t("coverAutoAssigned")}
                    </p>
                  </div>
                ) : (
                  <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-white/20 bg-black/30 text-xs text-white/45">
                    {t("coverEmpty")}
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    void onPickCover(e.target.files?.[0] || null);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => fileRef.current?.click()}
                  className="w-full rounded-xl border border-white/15 py-2.5 text-sm font-medium text-white/85 disabled:opacity-50"
                >
                  {t("uploadCover")}
                </button>
                {draft.imageUploaded && (
                  <button
                    type="button"
                    onClick={() => patch({ image: "", imageUploaded: false })}
                    className="w-full text-xs text-white/45"
                  >
                    {t("clearCover")}
                  </button>
                )}
                <div className="pt-2">
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-white/40">
                    {t("quickReview")}
                  </p>
                  <div className="space-y-2">
                    <ReviewRow label={t("fieldTitle")} value={draft.title} />
                    <ReviewRow label={t("fieldLocation")} value={draft.location} />
                    <ReviewRow
                      label={t("fieldDescription")}
                      value={draft.description}
                    />
                  </div>
                </div>
              </div>
            )}

            {stepId === "terms" && (
              <div className="space-y-4">
                <p className="text-sm text-white/70">{t("termsIntro")}</p>
                <Link
                  href={TERMS_PATH}
                  target="_blank"
                  className="inline-block text-sm font-medium text-supp-red underline underline-offset-2"
                >
                  {t("termsLinkLabel")}
                </Link>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--supp-red,#e11d48)]"
                  />
                  <span className="text-sm text-white/80">{t("termsAgree")}</span>
                </label>
                <p className="text-xs text-white/45">{t("reviewNote")}</p>
              </div>
            )}
          </div>

          {error && (
            <p className="mt-3 rounded-xl border border-red-400/40 bg-red-500/15 px-3 py-2 text-xs text-red-100">
              {error}
            </p>
          )}
        </section>

        {stepId === "basics" && (searching || matches.length > 0) && (
          <section className="rounded-2xl bg-black/70 p-4 backdrop-blur-sm">
            <h2 className="text-sm font-semibold text-white/90">
              {t("similarTitle")}
            </h2>
            <p className="mt-1 text-xs text-white/45">{t("similarHint")}</p>
            {searching && matches.length === 0 ? (
              <p className="mt-3 text-xs text-white/40">{t("searching")}</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {matches.map((idea) => (
                  <li key={idea.id}>
                    <Link
                      href={`/ideas/${idea.id}`}
                      className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-2 transition hover:bg-white/10"
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                        <Image
                          src={idea.image}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">
                          {idea.title}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-[11px] text-white/50">
                          {idea.summary || idea.city}
                        </p>
                      </div>
                      <span className="self-center text-white/40">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>

      <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 border-t border-white/10 bg-[#141414] p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:max-w-lg">
        {stepId === "terms" ? (
          <button
            type="button"
            disabled={busy || !termsAccepted}
            onClick={() => void onSubmit()}
            className="w-full rounded-xl bg-supp-red py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? t("submitting") : t("submit")}
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => void onNext()}
            className="w-full rounded-xl bg-supp-red py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? t("saving") : t("next")}
          </button>
        )}
      </div>

      {toast && (
        <div className="fixed inset-x-4 bottom-28 z-40 mx-auto max-w-md rounded-2xl bg-black/90 px-4 py-3 text-center text-sm text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}

function AiCornerButton({
  label,
  busy,
  onClick,
}: {
  label: string;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="absolute bottom-3 end-3 rounded-full bg-supp-red px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg disabled:opacity-50"
    >
      {busy ? "…" : label}
    </button>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-white/40">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-white/85">
        {value || "—"}
      </p>
    </div>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-white/45">
      {children}
    </p>
  );
}
