"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  formatCommentTime,
  type IdeaComment,
} from "@/data/mock-comments";

const MAX_IMAGES = 6;

type DraftImage = {
  name: string;
  mime: string;
  dataUrl: string;
};

export function IdeaComments({ ideaId }: { ideaId: string }) {
  const t = useTranslations("idea");
  const locale = useLocale();
  const zh = locale === "zh";
  const fileRef = useRef<HTMLInputElement>(null);

  const [comments, setComments] = useState<IdeaComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [draftImages, setDraftImages] = useState<DraftImage[]>([]);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetch(`/api/ideas/${ideaId}/comments`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setComments(Array.isArray(data.comments) ? data.comments : []);
      })
      .catch(() => {
        if (!cancelled) setComments([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ideaId]);

  const roots = useMemo(
    () => comments.filter((c) => !c.parentId),
    [comments],
  );

  function repliesOf(parentId: string) {
    return comments.filter((c) => c.parentId === parentId);
  }

  function toggleLike(id: string) {
    setComments((list) =>
      list.map((c) => {
        if (c.id !== id) return c;
        const liked = !c.likedByMe;
        return {
          ...c,
          likedByMe: liked,
          likes: Math.max(0, c.likes + (liked ? 1 : -1)),
        };
      }),
    );
  }

  async function onPickImages(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    const remaining = MAX_IMAGES - draftImages.length;
    const picked = Array.from(files).slice(0, remaining);

    const next: DraftImage[] = [];
    for (const file of picked) {
      if (!file.type.startsWith("image/")) {
        setError(t("moderationBadImageType"));
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(t("moderationImageTooLarge"));
        continue;
      }
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      next.push({
        name: file.name,
        mime: file.type,
        dataUrl,
      });
    }
    if (next.length) setDraftImages((prev) => [...prev, ...next]);
  }

  async function submitComment() {
    const body = draft.trim();
    if ((!body && draftImages.length === 0) || posting) return;
    setPosting(true);
    setError("");

    try {
      const res = await fetch(`/api/ideas/${ideaId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: body,
          parentId: replyTo || undefined,
          images: draftImages,
        }),
      });
      const data = await res.json();
      if (res.status === 422 || data.code === "blocked") {
        setError(zh ? data.reasonZh || t("moderationBlocked") : data.reason || t("moderationBlocked"));
        return;
      }
      if (!res.ok) {
        setError(t("toastFailed"));
        return;
      }
      if (data.comment) {
        setComments((list) => [data.comment as IdeaComment, ...list]);
      }
      setDraft("");
      setDraftImages([]);
      setReplyTo(null);
      setComposerOpen(false);
    } catch {
      setError(t("toastFailed"));
    } finally {
      setPosting(false);
    }
  }

  function startReply(id: string) {
    setReplyTo(id);
    setComposerOpen(true);
    setError("");
  }

  const replyTarget = replyTo
    ? comments.find((c) => c.id === replyTo)
    : null;

  return (
    <section className="rounded-2xl bg-white/5 p-4">
      <h2 className="text-sm font-semibold">{t("comments")}</h2>

      {loading ? (
        <p className="mt-3 text-xs text-white/45">{t("commentsLoading")}</p>
      ) : (
        <div className="mt-3 space-y-4">
          {roots.map((comment) => (
            <div key={comment.id} className="space-y-2">
              <CommentCard
                comment={comment}
                locale={locale}
                zh={zh}
                onLike={() => toggleLike(comment.id)}
                onReply={() => startReply(comment.id)}
                t={t}
              />
              {repliesOf(comment.id).map((reply) => (
                <div key={reply.id} className="ms-8 border-s border-white/10 ps-3">
                  <CommentCard
                    comment={reply}
                    locale={locale}
                    zh={zh}
                    onLike={() => toggleLike(reply.id)}
                    onReply={() => startReply(comment.id)}
                    t={t}
                    compact
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {!composerOpen ? (
        <button
          type="button"
          onClick={() => {
            setComposerOpen(true);
            setError("");
          }}
          className="mt-4 w-full rounded-xl border border-white/15 py-2.5 text-sm text-white/80"
        >
          {t("writeComment")}
        </button>
      ) : (
        <div className="mt-4 space-y-3 rounded-xl border border-white/10 bg-black/25 p-3">
          {replyTarget && (
            <div className="flex items-center justify-between text-[11px] text-white/55">
              <span>
                {t("replyingTo", {
                  name: zh ? replyTarget.authorNameZh : replyTarget.authorName,
                })}
              </span>
              <button
                type="button"
                className="text-white/70"
                onClick={() => setReplyTo(null)}
              >
                {t("cancelReply")}
              </button>
            </div>
          )}
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            placeholder={t("commentPlaceholder")}
            className="w-full resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-supp-red"
          />
          {draftImages.length > 0 && (
            <div className="flex gap-2 overflow-x-auto">
              {draftImages.map((img, i) => (
                <div
                  key={`${img.name}-${i}`}
                  className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.dataUrl} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() =>
                      setDraftImages((imgs) => imgs.filter((_, idx) => idx !== i))
                    }
                    className="absolute end-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-[10px] text-white"
                    aria-label={t("removeImage")}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          {error && (
            <p className="rounded-lg border border-red-500/40 bg-red-500/15 px-3 py-2 text-xs text-red-200">
              {error}
            </p>
          )}
          <div className="flex items-center justify-between gap-2">
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={(e) => {
                  void onPickImages(e.target.files);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={draftImages.length >= MAX_IMAGES || posting}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/80 disabled:opacity-40"
              >
                {t("addImages")}
              </button>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setComposerOpen(false);
                  setReplyTo(null);
                  setDraft("");
                  setDraftImages([]);
                  setError("");
                }}
                className="rounded-lg px-3 py-1.5 text-xs text-white/60"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={() => void submitComment()}
                disabled={posting}
                className="rounded-lg bg-supp-red px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                {posting ? t("postingComment") : t("postComment")}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function CommentCard({
  comment,
  locale,
  zh,
  onLike,
  onReply,
  t,
  compact,
}: {
  comment: IdeaComment;
  locale: string;
  zh: boolean;
  onLike: () => void;
  onReply: () => void;
  t: (key: string, values?: Record<string, string | number>) => string;
  compact?: boolean;
}) {
  const name = zh ? comment.authorNameZh : comment.authorName;
  const city = zh ? comment.cityZh : comment.city;
  const country = zh ? comment.countryZh : comment.country;
  const body = zh ? comment.bodyZh : comment.body;

  return (
    <div className={`rounded-xl bg-black/25 ${compact ? "px-2.5 py-2" : "px-3 py-2.5"}`}>
      <div className="flex gap-2.5">
        <div
          className={`relative shrink-0 overflow-hidden rounded-full bg-white/10 ${
            compact ? "h-8 w-8" : "h-10 w-10"
          }`}
        >
          {comment.authorUserId ? (
            <Link href={`/users/${comment.authorUserId}`} className="absolute inset-0">
              <Image
                src={comment.authorAvatar}
                alt=""
                fill
                className="object-cover"
                sizes="40px"
              />
            </Link>
          ) : (
            <Image
              src={comment.authorAvatar}
              alt=""
              fill
              className="object-cover"
              sizes="40px"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            {comment.authorUserId ? (
              <Link
                href={`/users/${comment.authorUserId}`}
                className="text-xs font-semibold text-white/95 hover:underline"
              >
                {name}
              </Link>
            ) : (
              <p className="text-xs font-semibold text-white/95">{name}</p>
            )}
            <p className="text-[10px] text-white/45">
              {city}, {country}
            </p>
            <p className="text-[10px] text-white/35">
              {formatCommentTime(comment.postedAt, locale)}
            </p>
          </div>
          {body ? (
            <p className="mt-1 text-sm leading-relaxed text-white/70">{body}</p>
          ) : null}
          {comment.images.length > 0 && (
            <div className="mt-2 flex gap-2 overflow-x-auto">
              {comment.images.map((src, idx) => (
                <div
                  key={`${comment.id}-img-${idx}`}
                  className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg"
                >
                  {src.startsWith("data:") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Image
                      src={src}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onLike}
              className={`text-[11px] font-medium ${
                comment.likedByMe ? "text-supp-red" : "text-white/55"
              }`}
            >
              {t("like")}
              {comment.likes > 0 ? ` · ${comment.likes}` : ""}
            </button>
            <button
              type="button"
              onClick={onReply}
              className="text-[11px] font-medium text-white/55"
            >
              {t("reply")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
