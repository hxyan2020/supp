import { NextResponse } from "next/server";
import { getCommentById, listCommentsByUser } from "@/lib/db";
import { getIdeaById } from "@/lib/ideas-service";
import { ensureSessionUser } from "@/lib/user-auth";

export type ActivityItem = {
  id: string;
  type: "comment" | "like";
  at: string;
  ideaId: string;
  ideaTitle: string;
  ideaTitleZh: string;
  body: string;
  bodyZh: string;
  commentId: string;
};

export async function GET() {
  try {
    const user = await ensureSessionUser();
    const items: ActivityItem[] = [];

    const myComments = await listCommentsByUser(user.id);
    for (const c of myComments) {
      const idea = await getIdeaById(c.ideaId);
      items.push({
        id: `comment-${c.id}`,
        type: "comment",
        at: c.postedAt,
        ideaId: c.ideaId,
        ideaTitle: idea?.title || c.ideaId,
        ideaTitleZh: idea?.titleZh || idea?.title || c.ideaId,
        body: c.body,
        bodyZh: c.bodyZh || c.body,
        commentId: c.id,
      });
    }

    const likedIds = user.likedCommentIds ?? [];
    const likedAt = user.likedCommentAt ?? {};
    for (const commentId of likedIds) {
      const c = await getCommentById(commentId);
      if (!c || c.status !== "published") continue;
      const idea = await getIdeaById(c.ideaId);
      items.push({
        id: `like-${c.id}`,
        type: "like",
        at: likedAt[commentId] || c.postedAt,
        ideaId: c.ideaId,
        ideaTitle: idea?.title || c.ideaId,
        ideaTitleZh: idea?.titleZh || idea?.title || c.ideaId,
        body: c.body,
        bodyZh: c.bodyZh || c.body,
        commentId: c.id,
      });
    }

    items.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

    return NextResponse.json(
      { items },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to load activity" },
      { status: 500 },
    );
  }
}
