import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { newId } from "@/lib/db";
import { ensureSessionUser } from "@/lib/user-auth";
import { screenImage } from "@/lib/content-moderation";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "ideas");
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: Request) {
  await ensureSessionUser();
  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Invalid form" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File required" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Image required" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image too large" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;
  const mod = await screenImage({
    name: file.name,
    mime: file.type,
    dataUrl,
    sizeBytes: file.size,
  });
  if (!mod.allowed) {
    return NextResponse.json(
      {
        error: "blocked",
        reason: mod.reason,
        reasonZh: mod.reasonZh,
      },
      { status: 422 },
    );
  }

  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : file.type === "image/gif"
          ? "gif"
          : "jpg";
  const filename = `${newId("cover")}.${ext}`;
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return NextResponse.json({ url: `/uploads/ideas/${filename}` });
}
