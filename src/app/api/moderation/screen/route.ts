import { NextResponse } from "next/server";
import {
  screenUserContent,
  type ImageScreenInput,
} from "@/lib/content-moderation";

/** Screen comment text + optional images before they are stored/rendered. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    text?: string;
    images?: ImageScreenInput[];
  };

  const result = await screenUserContent({
    text: body.text || "",
    images: Array.isArray(body.images) ? body.images.slice(0, 6) : [],
  });

  if (!result.allowed) {
    return NextResponse.json(
      {
        allowed: false,
        categories: result.categories,
        reason: result.reason,
        reasonZh: result.reasonZh,
      },
      { status: 422 },
    );
  }

  return NextResponse.json({ allowed: true });
}
