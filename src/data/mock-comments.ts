export type IdeaComment = {
  id: string;
  ideaId: string;
  authorName: string;
  authorNameZh: string;
  authorAvatar: string;
  city: string;
  cityZh: string;
  country: string;
  countryZh: string;
  body: string;
  bodyZh: string;
  postedAt: string;
  images: string[];
  likes: number;
  likedByMe?: boolean;
  parentId?: string;
};

const hoursAgo = (h: number) =>
  new Date(Date.now() - h * 60 * 60 * 1000).toISOString();

export const mockComments: IdeaComment[] = [
  {
    id: "c1",
    ideaId: "eavesdrop-headphones",
    authorName: "Stephen's buddy",
    authorNameZh: "史蒂芬的未具名基友",
    authorAvatar: "/images/avatar-1.png",
    city: "Hong Kong",
    cityZh: "香港",
    country: "China",
    countryZh: "中国",
    body: "Tried it once — the nearby chatter really pulls you in.",
    bodyZh: "试过一次，真的会被旁边的对话吸住注意力。",
    postedAt: hoursAgo(5),
    images: ["/images/event-cafe.jpg"],
    likes: 12,
  },
  {
    id: "c2",
    ideaId: "eavesdrop-headphones",
    authorName: "Mira",
    authorNameZh: "米拉",
    authorAvatar: "/images/persona.png",
    city: "Hong Kong",
    cityZh: "香港",
    country: "China",
    countryZh: "中国",
    body: "Pretend to check your phone or you'll get caught.",
    bodyZh: "记得假装看手机，不然很容易穿帮。",
    postedAt: hoursAgo(28),
    images: [],
    likes: 8,
  },
  {
    id: "c2r1",
    ideaId: "eavesdrop-headphones",
    parentId: "c2",
    authorName: "Kai Wong",
    authorNameZh: "黄凯",
    authorAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=96&h=96&q=80",
    city: "Kowloon",
    cityZh: "九龙",
    country: "China",
    countryZh: "中国",
    body: "True — sunglasses help too.",
    bodyZh: "没错，戴墨镜也有用。",
    postedAt: hoursAgo(20),
    images: [],
    likes: 3,
  },
  {
    id: "c3",
    ideaId: "sunrise-hike",
    authorName: "Lina Chen",
    authorNameZh: "陈丽娜",
    authorAvatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=96&h=96&q=80",
    city: "Hong Kong",
    cityZh: "香港",
    country: "China",
    countryZh: "中国",
    body: "Worth the early alarm. Coffee after sunrise was perfect.",
    bodyZh: "值得早起，日出后那杯咖啡太完美了。",
    postedAt: hoursAgo(12),
    images: ["/images/event-hike.jpg", "/images/hero-mountain.jpg"],
    likes: 21,
  },
  {
    id: "c4",
    ideaId: "night-market-crawl",
    authorName: "Theo Park",
    authorNameZh: "朴西奥",
    authorAvatar: "/images/persona.png",
    city: "Yau Ma Tei",
    cityZh: "油麻地",
    country: "China",
    countryZh: "中国",
    body: "Egg waffles first, then fish balls. Don't skip the last stall.",
    bodyZh: "先鸡蛋仔再鱼蛋，最后一摊别错过。",
    postedAt: hoursAgo(40),
    images: ["/images/event-food.jpg"],
    likes: 15,
  },
];

export function getCommentsForIdea(ideaId: string): IdeaComment[] {
  const matched = mockComments.filter((c) => c.ideaId === ideaId);
  if (matched.length) return matched;
  // Generic fallbacks for other ideas
  return [
    {
      id: `gen-${ideaId}-1`,
      ideaId,
      authorName: "Mira Zhou",
      authorNameZh: "周米拉",
      authorAvatar: "/images/avatar-1.png",
      city: "Hong Kong",
      cityZh: "香港",
      country: "China",
      countryZh: "中国",
      body: "Loved this — would do it again with friends.",
      bodyZh: "很喜欢，下次还想和朋友再来一次。",
      postedAt: hoursAgo(18),
      images: [],
      likes: 6,
    },
    {
      id: `gen-${ideaId}-2`,
      ideaId,
      authorName: "Sana Ali",
      authorNameZh: "萨娜",
      authorAvatar: "/images/avatar-user.jpg",
      city: "Central",
      cityZh: "中环",
      country: "China",
      countryZh: "中国",
      body: "Tips in the red card were spot on.",
      bodyZh: "红色卡片里的小贴士很实用。",
      postedAt: hoursAgo(52),
      images: ["/images/event-park.jpg"],
      likes: 4,
    },
  ];
}

export function formatCommentTime(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return locale.startsWith("zh") ? "刚刚" : "Just now";
  if (mins < 60)
    return locale.startsWith("zh") ? `${mins} 分钟前` : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24)
    return locale.startsWith("zh") ? `${hours} 小时前` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7)
    return locale.startsWith("zh") ? `${days} 天前` : `${days}d ago`;
  return date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  });
}
