import type { IdeaRecord } from "@/lib/types";

/** Extract search tokens from an idea name (EN + CJK aware). */
export function titleKeywords(input: string): string[] {
  const text = input.normalize("NFKC").trim().toLowerCase();
  if (!text) return [];

  const tokens = new Set<string>();
  for (const word of text.split(/[^\p{L}\p{N}]+/u)) {
    if (word.length >= 2) tokens.add(word);
  }

  // CJK bigrams for denser matching
  const cjk = text.replace(/[^\u4e00-\u9fff]/g, "");
  for (let i = 0; i < cjk.length - 1; i++) {
    tokens.add(cjk.slice(i, i + 2));
  }
  if (cjk.length === 1) tokens.add(cjk);

  return [...tokens].slice(0, 24);
}

export function ideaMatchesKeywords(
  idea: IdeaRecord,
  keywords: string[],
): boolean {
  if (!keywords.length) return false;
  const hay = [
    idea.title,
    idea.titleZh,
    idea.summary,
    idea.summaryZh,
    idea.description,
    idea.descriptionZh,
    idea.location,
    idea.locationZh,
    ...(idea.tags || []),
  ]
    .join(" ")
    .toLowerCase();

  return keywords.some((k) => hay.includes(k));
}

export function searchIdeasByTitleKeywords(
  ideas: IdeaRecord[],
  query: string,
  opts?: { excludeId?: string; limit?: number },
): IdeaRecord[] {
  const keywords = titleKeywords(query);
  if (!keywords.length) return [];
  const limit = opts?.limit ?? 12;
  return ideas
    .filter((idea) => {
      if (opts?.excludeId && idea.id === opts.excludeId) return false;
      if (idea.creationStatus === "rejected") return false;
      // Prefer live / pending peers for duplication awareness
      if (idea.creationStatus === "draft" && !idea.published) return false;
      return ideaMatchesKeywords(idea, keywords);
    })
    .slice(0, limit);
}
