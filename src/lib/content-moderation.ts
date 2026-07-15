export type ModerationCategory =
  | "political"
  | "vulgar"
  | "illegal"
  | "hate"
  | "sexual_minors"
  | "violence"
  | "spam";

export type ModerationResult = {
  allowed: boolean;
  categories: ModerationCategory[];
  /** Safe reason for clients (no raw matched terms). */
  reason: string;
  reasonZh: string;
};

type Rule = {
  category: ModerationCategory;
  /** Case-insensitive; Chinese terms matched as substrings. */
  patterns: RegExp[];
};

function lit(term: string, flags = "i"): RegExp {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Latin words use boundaries; CJK matches as substring.
  if (/[\u4e00-\u9fff]/.test(term)) return new RegExp(escaped, flags);
  return new RegExp(`(?:^|[^a-z0-9_])${escaped}(?:$|[^a-z0-9_])`, flags);
}

/** Curated blocklist for UGC: political sensitivity, vulgarity, illegal content. */
const RULES: Rule[] = [
  {
    category: "political",
    patterns: [
      lit("台独"),
      lit("港独"),
      lit("藏独"),
      lit("疆独"),
      lit("分裂国家"),
      lit("颠覆国家"),
      lit("法轮功"),
      lit("六四事件"),
      lit("天安门自焚"),
      lit("打倒共产党"),
      lit("打倒中共"),
      lit("xi jinping step down", "i"),
      lit("推翻政权"),
    ],
  },
  {
    category: "vulgar",
    patterns: [
      lit("fuck"),
      lit("fucking"),
      lit("motherfucker"),
      lit("shit"),
      lit("bitch"),
      lit("asshole"),
      lit("dickhead"),
      lit("cunt"),
      lit("slut"),
      lit("whore"),
      lit("鸡巴"),
      lit("操你"),
      lit("操死"),
      lit("草泥马"),
      lit("妈逼"),
      lit("他妈的"),
      lit("傻逼"),
      lit("傻B"),
      lit("贱人"),
      lit("烂货"),
      lit("狗日的"),
      lit("屌丝逼"),
    ],
  },
  {
    category: "illegal",
    patterns: [
      lit("冰毒"),
      lit("摇头丸"),
      lit("海洛因"),
      lit("出售枪支"),
      lit("买卖枪支"),
      lit("卖淫"),
      lit("嫖娼"),
      lit("人口贩卖"),
      lit("雇凶杀人"),
      lit("制造炸弹"),
      lit("buy cocaine"),
      lit("sell cocaine"),
      lit("sell meth"),
      lit("buy meth"),
      lit("sell fentanyl"),
      lit("hire a hitman"),
    ],
  },
  {
    category: "hate",
    patterns: [
      lit("种族灭绝"),
      lit("杀光"),
      lit("去死吧"),
      lit("灭绝华人"),
      lit("灭独"),
      lit("nigger"),
      lit("kike"),
      lit("chink"),
    ],
  },
  {
    category: "sexual_minors",
    patterns: [
      lit("儿童色情"),
      lit("幼女"),
      lit("恋童"),
      lit("未成年色情"),
      lit("child porn"),
      lit("child pornography"),
      lit("underage porn"),
      lit("loli porn"),
    ],
  },
  {
    category: "violence",
    patterns: [
      lit("血腥屠杀"),
      lit("如何杀人"),
      lit("how to make a bomb"),
      lit("how to kill someone"),
    ],
  },
];

const CATEGORY_COPY: Record<
  ModerationCategory,
  { reason: string; reasonZh: string }
> = {
  political: {
    reason: "This content includes politically sensitive material and was blocked.",
    reasonZh: "内容包含政治敏感信息，已被拦截。",
  },
  vulgar: {
    reason: "This content includes vulgar or abusive language and was blocked.",
    reasonZh: "内容包含辱骂或不雅用语，已被拦截。",
  },
  illegal: {
    reason: "This content appears to involve illegal activity and was blocked.",
    reasonZh: "内容疑似涉及违法信息，已被拦截。",
  },
  hate: {
    reason: "This content includes hate speech and was blocked.",
    reasonZh: "内容包含仇恨言论，已被拦截。",
  },
  sexual_minors: {
    reason: "This content violates child-safety rules and was blocked.",
    reasonZh: "内容违反未成年人保护规定，已被拦截。",
  },
  violence: {
    reason: "This content includes extreme violence or crime instructions and was blocked.",
    reasonZh: "内容包含极端暴力或违法指引，已被拦截。",
  },
  spam: {
    reason: "This content looks like spam and was blocked.",
    reasonZh: "内容疑似垃圾信息，已被拦截。",
  },
};

function normalizeText(input: string): string {
  return input
    .normalize("NFKC")
    .replace(/[\u200b-\u200d\ufeff]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function screenText(input: string): ModerationResult {
  const text = normalizeText(input || "");
  if (!text) {
    return { allowed: true, categories: [], reason: "", reasonZh: "" };
  }

  // Spam: too many repeated characters / obvious promo dumps
  if (/(.)\1{12,}/u.test(text) || /(?:https?:\/\/\S+\s*){5,}/i.test(text)) {
    return {
      allowed: false,
      categories: ["spam"],
      ...CATEGORY_COPY.spam,
    };
  }

  const hits = new Set<ModerationCategory>();
  for (const rule of RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) {
        hits.add(rule.category);
        break;
      }
    }
  }

  if (hits.size === 0) {
    return { allowed: true, categories: [], reason: "", reasonZh: "" };
  }

  const primary = [...hits][0];
  return {
    allowed: false,
    categories: [...hits],
    ...CATEGORY_COPY[primary],
  };
}

export type ImageScreenInput = {
  /** Original filename if known */
  name?: string;
  mime?: string;
  /** data:image/...;base64,... or https URL */
  dataUrl?: string;
  sizeBytes?: number;
};

const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function mimeFromDataUrl(dataUrl: string): string | null {
  const m = /^data:([^;,]+)/i.exec(dataUrl);
  return m ? m[1].toLowerCase() : null;
}

function extractSvgText(dataUrl: string): string {
  if (!dataUrl.startsWith("data:image/svg")) return "";
  try {
    const comma = dataUrl.indexOf(",");
    if (comma < 0) return "";
    const meta = dataUrl.slice(0, comma);
    const payload = dataUrl.slice(comma + 1);
    const raw = /;base64/i.test(meta)
      ? Buffer.from(payload, "base64").toString("utf8")
      : decodeURIComponent(payload);
    return raw.replace(/<[^>]+>/g, " ");
  } catch {
    return "";
  }
}

function estimateDataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return 0;
  const payload = dataUrl.slice(comma + 1);
  if (/;base64/i.test(dataUrl.slice(0, comma))) {
    return Math.floor((payload.length * 3) / 4);
  }
  return payload.length;
}

/** Local image guards (MIME, size, filename, SVG text). */
export function screenImageLocal(image: ImageScreenInput): ModerationResult {
  const name = image.name || "";
  const nameHit = screenText(name.replace(/\.[a-z0-9]+$/i, " ").replace(/[_-]+/g, " "));
  if (!nameHit.allowed) return nameHit;

  const mime =
    (image.mime || "").toLowerCase() ||
    (image.dataUrl ? mimeFromDataUrl(image.dataUrl) : null) ||
    "";

  if (mime && !ALLOWED_IMAGE_MIME.has(mime) && mime !== "image/svg+xml") {
    return {
      allowed: false,
      categories: ["illegal"],
      reason: "Unsupported image type.",
      reasonZh: "不支持的图片格式。",
    };
  }

  // SVG can embed arbitrary text — screen it.
  if (image.dataUrl) {
    const svgText = extractSvgText(image.dataUrl);
    if (svgText) {
      const hit = screenText(svgText);
      if (!hit.allowed) return hit;
    }
    const bytes = image.sizeBytes ?? estimateDataUrlBytes(image.dataUrl);
    if (bytes > MAX_IMAGE_BYTES) {
      return {
        allowed: false,
        categories: ["spam"],
        reason: "Image is too large (max 5MB).",
        reasonZh: "图片过大（最大 5MB）。",
      };
    }
  }

  return { allowed: true, categories: [], reason: "", reasonZh: "" };
}

async function screenImageWithOpenAI(
  dataUrl: string,
): Promise<ModerationResult | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key || !dataUrl.startsWith("data:image/")) return null;

  try {
    const res = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "omni-moderation-latest",
        input: [{ type: "image_url", image_url: { url: dataUrl } }],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      results?: Array<{
        flagged?: boolean;
        categories?: Record<string, boolean>;
      }>;
    };
    const result = data.results?.[0];
    if (!result?.flagged) return { allowed: true, categories: [], reason: "", reasonZh: "" };

    const cats = result.categories || {};
    let category: ModerationCategory = "illegal";
    if (cats["sexual/minors"] || cats.sexual_minors) category = "sexual_minors";
    else if (cats.hate || cats["hate/threatening"]) category = "hate";
    else if (cats.violence || cats["violence/graphic"]) category = "violence";
    else if (cats.sexual) category = "vulgar";
    else if (cats.illicit || cats["illicit/violent"]) category = "illegal";

    return {
      allowed: false,
      categories: [category],
      ...CATEGORY_COPY[category],
    };
  } catch {
    return null;
  }
}

export async function screenImage(
  image: ImageScreenInput,
): Promise<ModerationResult> {
  const local = screenImageLocal(image);
  if (!local.allowed) return local;
  if (image.dataUrl) {
    const remote = await screenImageWithOpenAI(image.dataUrl);
    if (remote && !remote.allowed) return remote;
  }
  return { allowed: true, categories: [], reason: "", reasonZh: "" };
}

export type UserContentInput = {
  text?: string;
  images?: ImageScreenInput[];
};

export async function screenUserContent(
  input: UserContentInput,
): Promise<ModerationResult> {
  const textHit = screenText(input.text || "");
  if (!textHit.allowed) return textHit;

  for (const image of input.images || []) {
    const imageHit = await screenImage(image);
    if (!imageHit.allowed) return imageHit;
  }

  return { allowed: true, categories: [], reason: "", reasonZh: "" };
}

export function normalizeStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export function normalizeSocialEmbeds(value: unknown) {
  if (!Array.isArray(value)) return [];
  const platforms = new Set(["tiktok", "instagram", "xiaohongshu"]);
  return value
    .map((raw) => {
      const item = raw as Record<string, unknown>;
      const platform = String(item.platform || "");
      const url = String(item.url || "").trim();
      if (!platforms.has(platform) || !url) return null;
      return {
        platform: platform as "tiktok" | "instagram" | "xiaohongshu",
        url,
        embedUrl: item.embedUrl ? String(item.embedUrl) : undefined,
        title: item.title ? String(item.title) : undefined,
        titleZh: item.titleZh ? String(item.titleZh) : undefined,
      };
    })
    .filter(Boolean) as Array<{
    platform: "tiktok" | "instagram" | "xiaohongshu";
    url: string;
    embedUrl?: string;
    title?: string;
    titleZh?: string;
  }>;
}
