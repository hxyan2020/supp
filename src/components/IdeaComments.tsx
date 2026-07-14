"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  formatCommentTime,
  getCommentsForIdea,
  type IdeaComment,
} from "@/data/mock-comments";
import { mockUser } from "@/data/mock-ideas";

const MAX_IMAGES = 6;

export function IdeaComments({ ideaId }: { ideaId: string }) {
  const t = useTranslations("idea");
  const locale = useLocale();
  const zh = locale === "zh";
  const fileRef = useRef<HTMLInputElement>(null);

  const [comments, setComments] = useState<IdeaComment[]>(() =>
    getCommentsForIdea(ideaId),
  );
  const [draft, setDraft] = useState("");
  const [draftImages, setDraftImages] = useState<string[]>([]);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);

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
    const remaining = MAX_IMAGES - draftImages.length;
    const picked = Array.from(files).slice(0, remaining);
    const urls = await Promise.all(
      picked.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          }),
      ),
    );
    setDraftImages((prev) => [...prev, ...urls]);
  }

  function submitComment() {
    const body = draft.trim();
    if (!body && draftImages.length === 0) return;
    const comment: IdeaComment = {
      id: `local-${Date.now()}`,
      ideaId,
      parentId: replyTo || undefined,
      authorName: mockUser.name,
      authorNameZh: mockUser.nameZh,
      authorAvatar: mockUser.avatar,
      city: "Hong Kong",
      cityZh: "香港",
      country: "China",
      countryZh: "中国",
      body,
      bodyZh: body,
      postedAt: new Date().toISOString(),
      images: draftImages,
      likes: 0,
      likedByMe: false,
    };
    setComments((list) => [...list, comment]);
    setDraft("");
    setDraftImages([]);
    setReplyTo(null);
    setComposerOpen(false);
  }

  function startReply(id: string) {
    setReplyTo(id);
    setComposerOpen(true);
  }

  const replyTarget = replyTo
    ? comments.find((c) => c.id === replyTo)
    : null;

  return (
    <section className="rounded-2xl bg-white/5 p-4">
      <h2 className="text-sm font-semibold">{t("comments")}</h2>

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

      {!composerOpen ? (
        <button
          type="button"
          onClick={() => setComposerOpen(true)}
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
              {draftImages.map((src, i) => (
                <div
                  key={`${src.slice(0, 24)}-${i}`}
                  className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
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
          <div className="flex items-center justify-between gap-2">
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
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
                disabled={draftImages.length >= MAX_IMAGES}
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
                }}
                className="rounded-lg px-3 py-1.5 text-xs text-white/60"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={submitComment}
                className="rounded-lg bg-supp-red px-3 py-1.5 text-xs font-semibold text-white"
              >
                {t("postComment")}
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
          <Image
            src={comment.authorAvatar}
            alt=""
            fill
            className="object-cover"
            sizes="40px"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <p className="text-xs font-semibold text-white/95">{name}</p>
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
              {comment.images.map((src) => (
                <div
                  key={src}
                  className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg"
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
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
