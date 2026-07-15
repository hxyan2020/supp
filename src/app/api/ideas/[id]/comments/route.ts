import { NextResponse } from "next/server";
import { getCommentsForIdea } from "@/data/mock-comments";
import {
  addComment,
  getIdeaFromDb,
  listPublishedComments,
  newId,
} from "@/lib/db";
import { getIdeaById as getMockIdeaById } from "@/data/mock-ideas";
import {
  screenUserContent,
  type ImageScreenInput,
} from "@/lib/content-moderation";
import { getSessionUserId } from "@/lib/user-auth";
import { getUserById } from "@/lib/db";
import type { CommentRecord } from "@/lib/types";

async function ideaExists(id: string) {
  const fromDb = await getIdeaFromDb(id).catch(() => undefined);
  if (fromDb) return true;
  return Boolean(getMockIdeaById(id));
}

function toClientComment(c: CommentRecord, likedByMe = false) {
  return {
    id: c.id,
    ideaId: c.ideaId,
    parentId: c.parentId,
    authorUserId: c.userId,
    authorName: c.authorName,
    authorNameZh: c.authorNameZh,
    authorAvatar: c.authorAvatar,
    city: c.city,
    cityZh: c.cityZh,
    country: c.country,
    countryZh: c.countryZh,
    body: c.body,
    bodyZh: c.bodyZh,
    postedAt: c.postedAt,
    images: c.images,
    likes: c.likes,
    likedByMe,
  };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const stored = await listPublishedComments(id);
  const sessionId = await getSessionUserId();
  const me = sessionId ? await getUserById(sessionId) : null;
  const likedSet = new Set(me?.likedCommentIds ?? []);

  const mock = getCommentsForIdea(id).map((c) => ({
    ...c,
    likedByMe: likedSet.has(c.id),
  }));
  const seen = new Set(stored.map((c) => c.id));
  const merged = [
    ...stored.map((c) => toClientComment(c, likedSet.has(c.id))),
    ...mock.filter((c) => !seen.has(c.id)),
  ].sort(
    (a, b) =>
      Date.parse(b.postedAt) - Date.parse(a.postedAt),
  );
  return NextResponse.json({ comments: merged });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!(await ideaExists(id))) {
    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    text?: string;
    parentId?: string;
    images?: Array<{
      name?: string;
      mime?: string;
      dataUrl?: string;
    }>;
  };

  const text = String(body.text || "").trim();
  const images = Array.isArray(body.images) ? body.images.slice(0, 6) : [];
  if (!text && images.length === 0) {
    return NextResponse.json(
      { error: "Comment is empty", code: "empty" },
      { status: 400 },
    );
  }

  const screenImages: ImageScreenInput[] = images.map((img) => ({
    name: img.name,
    mime: img.mime,
    dataUrl: img.dataUrl,
  }));

  const moderation = await screenUserContent({
    text,
    images: screenImages,
  });

  if (!moderation.allowed) {
    const sessionId = await getSessionUserId();
    await addComment({
      id: newId("cmt"),
      ideaId: id,
      parentId: body.parentId || undefined,
      userId: sessionId || undefined,
      authorName: "blocked",
      authorNameZh: "blocked",
      authorAvatar: "/avatars/default.svg",
      city: "",
      cityZh: "",
      country: "",
      countryZh: "",
      body: "",
      bodyZh: "",
      postedAt: new Date().toISOString(),
      images: [],
      likes: 0,
      status: "blocked",
      blockReason: moderation.categories.join(","),
    });

    return NextResponse.json(
      {
        error: "blocked",
        code: "blocked",
        categories: moderation.categories,
        reason: moderation.reason,
        reasonZh: moderation.reasonZh,
      },
      { status: 422 },
    );
  }

  const sessionId = await getSessionUserId();
  const user = sessionId ? await getUserById(sessionId) : null;

  const comment: CommentRecord = {
    id: newId("cmt"),
    ideaId: id,
    parentId: body.parentId || undefined,
    userId: user?.id,
    authorName: user?.name || "Guest",
    authorNameZh: user?.nameZh || user?.name || "访客",
    authorAvatar: user?.avatar || "/avatars/default.svg",
    city: user?.city || "Hong Kong",
    cityZh: user?.city || "香港",
    country: user?.country || "China",
    countryZh: user?.country || "中国",
    body: text,
    bodyZh: text,
    postedAt: new Date().toISOString(),
    images: images
      .map((img) => img.dataUrl)
      .filter((u): u is string => Boolean(u)),
    likes: 0,
    status: "published",
  };

  const saved = await addComment(comment);
  return NextResponse.json({ comment: toClientComment(saved) });
}
