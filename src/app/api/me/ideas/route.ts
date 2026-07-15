import { NextResponse } from "next/server";
import { ensureSessionUser } from "@/lib/user-auth";
import { getIdeaById, getPublishedIdeas } from "@/lib/ideas-service";
import type { Idea } from "@/data/mock-ideas";

export async function GET() {
  try {
    const user = await ensureSessionUser();
    const published = await getPublishedIdeas();
    const total = published.length;

    const collected: Idea[] = [];
    for (const id of user.favoritedIds ?? []) {
      const idea = await getIdeaById(id);
      if (idea) collected.push(idea);
    }

    const experienced: Idea[] = [];
    for (const id of user.experiencedIds ?? []) {
      const idea = await getIdeaById(id);
      if (idea) experienced.push(idea);
    }

    return NextResponse.json(
      {
        total,
        collected,
        experienced,
        experiencedAt: user.experiencedAt ?? {},
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to load ideas" },
      { status: 500 },
    );
  }
}
