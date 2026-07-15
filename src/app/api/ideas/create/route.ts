import { NextResponse } from "next/server";
import {
  getIdeaRecordById,
  listIdeasByCreator,
  newId,
  slugify,
  upsertIdea,
} from "@/lib/db";
import { assignBackgroundFromRepo } from "@/lib/backgrounds";
import { blankIdeaDraft } from "@/lib/idea-create";
import {
  normalizeStringList,
  screenUserContent,
} from "@/lib/content-moderation";
import { ensureSessionUser, publicUser } from "@/lib/user-auth";
import type { Category, Sensation } from "@/data/mock-ideas";
import type { IdeaRecord } from "@/lib/types";

type CreateBody = Partial<IdeaRecord> & {
  action?: "save_draft" | "submit";
  imageUploaded?: boolean;
};

function screenIdeaPayload(idea: IdeaRecord) {
  const text = [
    idea.title,
    idea.titleZh,
    idea.summary,
    idea.summaryZh,
    idea.description,
    idea.descriptionZh,
    idea.tip,
    idea.tipZh,
    idea.location,
    idea.address,
    ...(idea.steps || []),
    ...(idea.needs || []),
  ].join("\n");
  return screenUserContent({ text });
}

export async function GET() {
  const user = await ensureSessionUser();
  const ideas = await listIdeasByCreator(user.id);
  return NextResponse.json({
    user: publicUser(user),
    ideas: ideas.map((idea) => ({
      id: idea.id,
      title: idea.title,
      creationStatus:
        idea.creationStatus || (idea.published ? "published" : "draft"),
      published: idea.published,
      image: idea.image,
      updatedAt: idea.updatedAt,
      rejectionReason: idea.rejectionReason,
      rejectionReasonZh: idea.rejectionReasonZh,
    })),
  });
}

export async function POST(req: Request) {
  const user = await ensureSessionUser();
  const body = (await req.json().catch(() => ({}))) as CreateBody;
  const action = body.action || "save_draft";
  const now = new Date().toISOString();

  const existing =
    body.id && (await getIdeaRecordById(body.id));
  if (existing?.creatorUserId && existing.creatorUserId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (
    existing?.creationStatus === "published" ||
    (existing?.published && existing.creationStatus !== "draft")
  ) {
    return NextResponse.json(
      { error: "Published ideas cannot be edited here" },
      { status: 400 },
    );
  }

  const baseId =
    existing?.id ||
    slugify(body.title || "") ||
    newId("idea");

  let image = body.image?.trim() || existing?.image || "";
  let imageAssignedFromRepo =
    existing?.imageAssignedFromRepo ?? false;

  // Cover: upload wins; otherwise assign once from repo and lock
  if (body.imageUploaded && image) {
    imageAssignedFromRepo = false;
  } else if (!image || imageAssignedFromRepo) {
    if (!image || !existing?.image) {
      const picked = assignBackgroundFromRepo(
        `${body.title || baseId}-${user.id}`,
      );
      image = picked.path;
      imageAssignedFromRepo = true;
    }
  }

  const draft = blankIdeaDraft({
    ...(existing || {}),
    ...body,
    id: baseId,
    title: body.title ?? existing?.title ?? "",
    titleZh: body.titleZh ?? body.title ?? existing?.titleZh ?? "",
    summary: body.summary ?? existing?.summary ?? "",
    summaryZh: body.summaryZh ?? body.summary ?? existing?.summaryZh ?? "",
    description: body.description ?? existing?.description ?? "",
    descriptionZh:
      body.descriptionZh ?? body.description ?? existing?.descriptionZh ?? "",
    tip: body.tip ?? existing?.tip ?? "",
    tipZh: body.tipZh ?? body.tip ?? existing?.tipZh ?? "",
    location: body.location ?? existing?.location ?? "",
    locationZh: body.locationZh ?? body.location ?? existing?.locationZh ?? "",
    address: body.address ?? existing?.address ?? "",
    addressZh: body.addressZh ?? body.address ?? existing?.addressZh ?? "",
    city: body.city ?? existing?.city ?? "",
    country: body.country ?? existing?.country ?? "",
    date: body.date ?? existing?.date ?? "Anytime",
    durationMin:
      body.durationMin != null
        ? Number(body.durationMin)
        : existing?.durationMin ?? 60,
    fee: body.fee != null ? Number(body.fee) : existing?.fee ?? 0,
    weather: body.weather || existing?.weather || "any",
    categories: (body.categories as Category[]) ||
      existing?.categories || ["social"],
    sensation:
      (body.sensation as Sensation) || existing?.sensation || "curious",
    lat: body.lat != null ? Number(body.lat) : existing?.lat ?? 0,
    lng: body.lng != null ? Number(body.lng) : existing?.lng ?? 0,
    steps: normalizeStringList(body.steps ?? existing?.steps),
    stepsZh: normalizeStringList(
      body.stepsZh ?? body.steps ?? existing?.stepsZh,
    ),
    needs: normalizeStringList(body.needs ?? existing?.needs),
    needsZh: normalizeStringList(
      body.needsZh ?? body.needs ?? existing?.needsZh,
    ),
    image,
    imageAssignedFromRepo,
    organizer: user.name,
    organizerZh: user.nameZh || user.name,
    organizerAvatar: user.avatar,
    creatorUserId: user.id,
    creatorName: user.name,
    creatorNameZh: user.nameZh || user.name,
    creationStatus: "draft",
    published: false,
    sourcePlatform: "user-create",
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  });

  if (action === "save_draft") {
    if (!draft.title.trim()) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }
    const saved = await upsertIdea(draft);
    return NextResponse.json({
      idea: saved,
      creationStatus: "draft",
    });
  }

  // Submit → screen → publish or reject
  if (!draft.title.trim() || !draft.description.trim()) {
    return NextResponse.json(
      { error: "Title and description are required to submit" },
      { status: 400 },
    );
  }

  const moderation = await screenIdeaPayload(draft);
  if (!moderation.allowed) {
    const rejected = await upsertIdea({
      ...draft,
      creationStatus: "rejected",
      published: false,
      rejectionReason: moderation.reason,
      rejectionReasonZh: moderation.reasonZh,
      updatedAt: now,
    });
    return NextResponse.json(
      {
        error: "blocked",
        code: "blocked",
        reason: moderation.reason,
        reasonZh: moderation.reasonZh,
        idea: rejected,
        creationStatus: "rejected",
      },
      { status: 422 },
    );
  }

  const published = await upsertIdea({
    ...draft,
    creationStatus: "published",
    published: true,
    rejectionReason: undefined,
    rejectionReasonZh: undefined,
    updatedAt: now,
  });

  return NextResponse.json({
    idea: published,
    creationStatus: "published",
  });
}
