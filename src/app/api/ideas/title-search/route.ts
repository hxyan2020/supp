import { NextResponse } from "next/server";
import { listAllIdeas } from "@/lib/db";
import { searchIdeasByTitleKeywords } from "@/lib/idea-search";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const excludeId = searchParams.get("excludeId") || undefined;
  const locale = searchParams.get("locale") || "en";
  const zh = locale === "zh";

  if (q.trim().length < 2) {
    return NextResponse.json({ ideas: [], keywords: [] });
  }

  const ideas = await listAllIdeas();
  const matches = searchIdeasByTitleKeywords(ideas, q, {
    excludeId,
    limit: 10,
  });

  return NextResponse.json({
    ideas: matches.map((idea) => ({
      id: idea.id,
      title: zh ? idea.titleZh || idea.title : idea.title,
      summary: zh ? idea.summaryZh || idea.summary : idea.summary,
      image: idea.image,
      city: idea.city,
      published: idea.published,
      creationStatus: idea.creationStatus || (idea.published ? "published" : "draft"),
    })),
  });
}
