import { NextResponse } from "next/server";
import { generateIdeaAssist } from "@/lib/idea-create";
import { screenText } from "@/lib/content-moderation";
import { ensureSessionUser } from "@/lib/user-auth";

export async function POST(req: Request) {
  await ensureSessionUser();
  const body = (await req.json().catch(() => ({}))) as {
    field?: "description" | "steps";
    title?: string;
    summary?: string;
    location?: string;
    locale?: string;
  };

  if (body.field !== "description" && body.field !== "steps") {
    return NextResponse.json({ error: "Invalid field" }, { status: 400 });
  }
  const title = String(body.title || "").trim();
  if (!title) {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }

  const titleScreen = screenText(title);
  if (!titleScreen.allowed) {
    return NextResponse.json(
      {
        error: "blocked",
        reason: titleScreen.reason,
        reasonZh: titleScreen.reasonZh,
      },
      { status: 422 },
    );
  }

  const result = await generateIdeaAssist(body.field, {
    title,
    summary: body.summary,
    location: body.location,
    locale: body.locale,
  });

  // Screen generated output before returning
  if (result.text) {
    const hit = screenText(result.text);
    if (!hit.allowed) {
      return NextResponse.json(
        { error: "blocked", reason: hit.reason, reasonZh: hit.reasonZh },
        { status: 422 },
      );
    }
  }
  if (result.steps?.length) {
    const hit = screenText(result.steps.join("\n"));
    if (!hit.allowed) {
      return NextResponse.json(
        { error: "blocked", reason: hit.reason, reasonZh: hit.reasonZh },
        { status: 422 },
      );
    }
  }

  return NextResponse.json(result);
}
