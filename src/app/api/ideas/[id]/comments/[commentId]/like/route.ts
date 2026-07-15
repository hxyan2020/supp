import { NextResponse } from "next/server";
import { getCommentsForIdea } from "@/data/mock-comments";
import {
  addComment,
  getCommentById,
  setCommentLiked,
} from "@/lib/db";
import { ensureSessionUser, publicUser } from "@/lib/user-auth";
import type { CommentRecord } from "@/lib/types";

async function resolveComment(
  ideaId: string,
  commentId: string,
): Promise<CommentRecord | null> {
  const existing = await getCommentById(commentId);
  if (existing) {
    if (existing.ideaId !== ideaId || existing.status !== "published") return null;
    return existing;
  }

  const mock = getCommentsForIdea(ideaId).find((c) => c.id === commentId);
  if (!mock) return null;

  // Persist mock into DB so likes / activity survive reloads.
  return addComment({
    id: mock.id,
    ideaId: mock.ideaId,
    parentId: mock.parentId,
    userId: mock.authorUserId,
    authorName: mock.authorName,
    authorNameZh: mock.authorNameZh,
    authorAvatar: mock.authorAvatar,
    city: mock.city,
    cityZh: mock.cityZh,
    country: mock.country,
    countryZh: mock.countryZh,
    body: mock.body,
    bodyZh: mock.bodyZh,
    postedAt: mock.postedAt,
    images: mock.images ?? [],
    likes: mock.likes ?? 0,
    status: "published",
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  try {
    const { id: ideaId, commentId } = await params;
    const body = (await req.json().catch(() => ({}))) as { active?: boolean };
    if (typeof body.active !== "boolean") {
      return NextResponse.json(
        { error: "active is required" },
        { status: 400 },
      );
    }

    const comment = await resolveComment(ideaId, commentId);
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const user = await ensureSessionUser();
    const result = await setCommentLiked(user.id, comment.id, body.active);
    if (!result) {
      return NextResponse.json({ error: "Failed to update like" }, { status: 500 });
    }

    return NextResponse.json({
      liked: body.active,
      likes: result.comment.likes,
      user: publicUser(result.user),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update like" }, { status: 500 });
  }
}
