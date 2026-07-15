import type { IdeaRecord } from "@/lib/types";

type AssistField = "description" | "steps";

type AssistContext = {
  title: string;
  summary?: string;
  location?: string;
  locale?: string;
};

function fallbackDescription(ctx: AssistContext, zh: boolean): string {
  const place = ctx.location?.trim();
  if (zh) {
    return place
      ? `围绕「${ctx.title}」在${place}展开一次轻松的体验。放慢节奏，留意身边的细节，让这件事成为你今天的小冒险。`
      : `围绕「${ctx.title}」展开一次轻松的体验。放慢节奏，留意身边的细节，让这件事成为你今天的小冒险。`;
  }
  return place
    ? `Try “${ctx.title}” around ${place}. Slow down, notice the details, and let this become today’s small adventure.`
    : `Try “${ctx.title}”. Slow down, notice the details, and let this become today’s small adventure.`;
}

function fallbackSteps(ctx: AssistContext, zh: boolean): string[] {
  if (zh) {
    return [
      `明确「${ctx.title}」你想体验的重点。`,
      "到达地点后先观察环境，找到舒适的开始方式。",
      "按自己的节奏完成体验，不必追求完美。",
      "结束后记下一个让你印象深刻的细节。",
    ];
  }
  return [
    `Decide what “${ctx.title}” should feel like for you.`,
    "Arrive, take in the place, and find a comfortable way to begin.",
    "Do the experience at your own pace — progress over perfection.",
    "Afterwards, note one detail that stayed with you.",
  ];
}

export async function generateIdeaAssist(
  field: AssistField,
  ctx: AssistContext,
): Promise<{ text?: string; steps?: string[]; source: "openai" | "template" }> {
  const zh = ctx.locale === "zh";
  const key = process.env.OPENAI_API_KEY;

  if (key) {
    try {
      const prompt =
        field === "description"
          ? zh
            ? `为体验点子写一段 80–140 字的中文描述。标题：${ctx.title}。摘要：${ctx.summary || "无"}。地点：${ctx.location || "未定"}。语气轻松、具体、可执行，不要标题和引号。`
            : `Write an 80–140 word experience description. Title: ${ctx.title}. Summary: ${ctx.summary || "n/a"}. Place: ${ctx.location || "TBD"}. Tone: casual, concrete, actionable. No title line or quotes.`
          : zh
            ? `为体验点子「${ctx.title}」写 4 个简洁中文步骤，每步一行，不要编号前缀以外的说明。地点：${ctx.location || "未定"}。`
            : `Write 4 concise steps for the experience “${ctx.title}”. One step per line, no numbering. Place: ${ctx.location || "TBD"}.`;

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.7,
          messages: [
            {
              role: "system",
              content:
                "You help users draft short, safe, non-political experience ideas for a city discovery app.",
            },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const content = data.choices?.[0]?.message?.content?.trim() || "";
        if (content) {
          if (field === "description") {
            return { text: content, source: "openai" };
          }
          const steps = content
            .split(/\r?\n/)
            .map((s) => s.replace(/^\s*\d+[\).、.\s-]*/, "").trim())
            .filter(Boolean)
            .slice(0, 8);
          if (steps.length) return { steps, source: "openai" };
        }
      }
    } catch {
      // fall through
    }
  }

  if (field === "description") {
    return { text: fallbackDescription(ctx, zh), source: "template" };
  }
  return { steps: fallbackSteps(ctx, zh), source: "template" };
}

export function blankIdeaDraft(
  partial: Partial<IdeaRecord> & Pick<IdeaRecord, "id">,
): IdeaRecord {
  const now = new Date().toISOString();
  return {
    id: partial.id,
    title: partial.title || "",
    titleZh: partial.titleZh || partial.title || "",
    summary: partial.summary || "",
    summaryZh: partial.summaryZh || partial.summary || "",
    description: partial.description || "",
    descriptionZh: partial.descriptionZh || partial.description || "",
    tip: partial.tip || "",
    tipZh: partial.tipZh || partial.tip || "",
    location: partial.location || "",
    locationZh: partial.locationZh || partial.location || "",
    address: partial.address || "",
    addressZh: partial.addressZh || partial.address || "",
    lat: partial.lat ?? 0,
    lng: partial.lng ?? 0,
    date: partial.date || "Anytime",
    startsAt: partial.startsAt,
    endsAt: partial.endsAt,
    durationMin: partial.durationMin ?? 60,
    fee: partial.fee ?? 0,
    weather: partial.weather || "any",
    city: partial.city || "",
    country: partial.country || "",
    categories: partial.categories?.length ? partial.categories : ["social"],
    sensation: partial.sensation || "curious",
    engagement: partial.engagement,
    image: partial.image || "/images/event-park.jpg",
    imageAssignedFromRepo: partial.imageAssignedFromRepo,
    organizer: partial.organizer || "Supp",
    organizerZh: partial.organizerZh || "嘛呢",
    organizerAvatar: partial.organizerAvatar || "/avatars/default.svg",
    experiencedCount: partial.experiencedCount ?? 0,
    favoritedCount: partial.favoritedCount ?? 0,
    participantCount: partial.participantCount ?? 0,
    maxParticipants: partial.maxParticipants ?? 20,
    relevance: partial.relevance ?? 70,
    tags: partial.tags || [],
    steps: partial.steps || [],
    stepsZh: partial.stepsZh || [],
    needs: partial.needs || [],
    needsZh: partial.needsZh || [],
    socialEmbeds: partial.socialEmbeds || [],
    published: false,
    creationStatus: partial.creationStatus || "draft",
    creatorUserId: partial.creatorUserId,
    creatorName: partial.creatorName,
    creatorNameZh: partial.creatorNameZh,
    rejectionReason: partial.rejectionReason,
    rejectionReasonZh: partial.rejectionReasonZh,
    sourceUrl: partial.sourceUrl,
    sourcePlatform: partial.sourcePlatform || "user-create",
    createdAt: partial.createdAt || now,
    updatedAt: now,
  };
}
