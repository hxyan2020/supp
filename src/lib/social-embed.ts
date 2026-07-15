import type { SocialEmbed, SocialPlatform } from "@/data/mock-ideas";

/** Build a player iframe src from an explicit embedUrl or a share URL. */
export function resolveSocialEmbedSrc(embed: SocialEmbed): string | null {
  const explicit = embed.embedUrl?.trim();
  if (explicit) return explicit;

  const url = embed.url?.trim() || "";
  if (!url) return null;

  if (embed.platform === "tiktok") {
    const videoId =
      url.match(/\/video\/(\d+)/)?.[1] ||
      url.match(/tiktok\.com\/.*?(\d{15,})/)?.[1];
    if (videoId) return `https://www.tiktok.com/embed/v2/${videoId}`;
  }

  if (embed.platform === "instagram") {
    const match = url.match(
      /instagram\.com\/(reel|p|tv)\/([A-Za-z0-9_-]+)/i,
    );
    if (match) {
      return `https://www.instagram.com/${match[1]}/${match[2]}/embed`;
    }
  }

  // Xiaohongshu does not provide a stable public iframe player.
  return null;
}

export function socialEmbedAspect(platform: SocialPlatform): string {
  // Vertical video for TT / IG reels; XHS link cards stay shorter.
  if (platform === "tiktok" || platform === "instagram") {
    return "aspect-[9/16] max-h-[520px]";
  }
  return "aspect-video";
}
