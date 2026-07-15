import { NextResponse } from "next/server";
import { getIdeaFromDb } from "@/lib/db";
import { getIdeaById } from "@/data/mock-ideas";
import { setIdeaMembership } from "@/lib/persona-service";
import { ensureSessionUser, publicUser } from "@/lib/user-auth";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      ideaId?: string;
      action?: "favorite" | "experienced";
      active?: boolean;
    };

    if (!body.ideaId || !body.action || typeof body.active !== "boolean") {
      return NextResponse.json(
        { error: "ideaId, action, and active are required" },
        { status: 400 },
      );
    }

    const idea =
      (await getIdeaFromDb(body.ideaId)) || getIdeaById(body.ideaId);
    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    const user = await ensureSessionUser();
    const field =
      body.action === "favorite" ? "favoritedIds" : "experiencedIds";
    const updated = await setIdeaMembership(
      user,
      body.ideaId,
      field,
      body.active,
    );

    return NextResponse.json({
      user: publicUser(updated),
      personaChanged: Boolean(updated.personaRoleId),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
