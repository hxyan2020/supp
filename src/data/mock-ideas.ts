export type Category =
  | "comfort"
  | "taste"
  | "outdoors"
  | "creative"
  | "social"
  | "culture"
  | "adrenaline"
  | "wellness";

export type Sensation = "calm" | "curious" | "stimulating" | "intense";

export type Engagement = "high" | "medium" | "low";

export type SocialPlatform = "tiktok" | "instagram" | "xiaohongshu";

export type SocialEmbed = {
  platform: SocialPlatform;
  url: string;
  /** Optional iframe / player URL */
  embedUrl?: string;
  title?: string;
  titleZh?: string;
};

export type Idea = {
  id: string;
  title: string;
  titleZh: string;
  summary: string;
  summaryZh: string;
  description: string;
  descriptionZh: string;
  tip: string;
  tipZh: string;
  location: string;
  locationZh: string;
  address: string;
  addressZh: string;
  lat: number;
  lng: number;
  date: string;
  /** ISO start time — used by map upcoming filter */
  startsAt: string;
  /** ISO end time — pin disappears after this */
  endsAt: string;
  durationMin: number;
  fee: number;
  weather: "sunny" | "cloudy" | "rainy" | "any";
  city: string;
  categories: Category[];
  sensation: Sensation;
  /** How much social / energetic effort the experience asks for */
  engagement: Engagement;
  image: string;
  organizer: string;
  organizerZh: string;
  organizerAvatar: string;
  /** User id of the author when known (opens third-person Me) */
  creatorUserId?: string;
  experiencedCount: number;
  favoritedCount: number;
  participantCount: number;
  maxParticipants: number;
  relevance: number;
  tags: string[];
  /** Step-by-step how-to (may be empty) */
  steps: string[];
  stepsZh: string[];
  /** Tools / materials needed (may be empty) */
  needs: string[];
  needsZh: string[];
  /** Optional short-form video embeds */
  socialEmbeds: SocialEmbed[];
};

export const categoryMeta: Record<
  Category,
  { label: string; labelZh: string }
> = {
  comfort: { label: "Comfort zone", labelZh: "舒适圈" },
  taste: { label: "Taste buds", labelZh: "味蕾" },
  outdoors: { label: "Outdoors", labelZh: "户外" },
  creative: { label: "Creative", labelZh: "创意" },
  social: { label: "Social", labelZh: "社交" },
  culture: { label: "Culture", labelZh: "文化" },
  adrenaline: { label: "Adrenaline", labelZh: "肾上腺素" },
  wellness: { label: "Wellness", labelZh: "身心" },
};

export const sensationMeta: Record<
  Sensation,
  { label: string; labelZh: string }
> = {
  calm: { label: "Calm", labelZh: "平静" },
  curious: { label: "Curious", labelZh: "好奇" },
  stimulating: { label: "Stimulating", labelZh: "刺激" },
  intense: { label: "Intense", labelZh: "强烈" },
};

export const mockIdeaSeeds: Omit<
  Idea,
  "startsAt" | "endsAt" | "engagement" | "steps" | "stepsZh" | "needs" | "needsZh" | "socialEmbeds"
>[] = [
  {
    id: "eavesdrop-headphones",
    title: "Turn down headphones & eavesdrop",
    titleZh: "将耳机音量调小偷听旁人谈话",
    summary: "A tiny social experiment in public spaces.",
    summaryZh: "在公共场合做一次微小的社交实验。",
    description:
      "Lower your headphone volume just enough to catch nearby conversations. Stay casual, look busy, and notice how the city sounds different when you listen.",
    descriptionZh:
      "把耳机音量调到刚好能听到旁边人说话。假装在忙别的，观察这座城市在“偷听模式”下有什么不同。",
    tip: "Pretend you're busy with something else. Never make eye contact with the person you're listening to — or a fight might break out!!",
    tipZh:
      "偷听的时候要尽可能假装在忙别的，眼神一定不要和被偷听对象有交集，不然会打架!!",
    location: "Central MTR concourse",
    locationZh: "中环地铁站大厅",
    address: "Central Station, Hong Kong",
    addressZh: "香港中环站",
    lat: 22.2819,
    lng: 114.1585,
    date: "Anytime · daytime",
    durationMin: 8,
    fee: 0,
    weather: "any",
    city: "Hong Kong",
    categories: ["comfort", "social"],
    sensation: "stimulating",
    image: "/images/hero-city.jpg",
    organizer: "Datui",
    organizerZh: "大腿儿",
    organizerAvatar: "/images/avatar-1.png",
    experiencedCount: 312,
    favoritedCount: 89,
    participantCount: 0,
    maxParticipants: 999,
    relevance: 98,
    tags: ["social experiment", "city"],
  },
  {
    id: "sunrise-hike",
    title: "Sunrise hike & pour-over coffee",
    titleZh: "日出登山再喝手冲咖啡",
    summary: "Trail before dawn, coffee after the light.",
    summaryZh: "黎明前上山，天亮后喝一杯手冲。",
    description:
      "Meet at the trailhead before dawn. Walk at an easy pace, pause for sunrise photos, then settle into a nearby café.",
    descriptionZh:
      "黎明前在登山口集合，轻松走上山看日出，再去附近咖啡馆喝一杯手冲，聊聊这一周。",
    tip: "Bring a light jacket — summit wind is colder than you expect.",
    tipZh: "记得带一件薄外套，山顶风比想象中凉。",
    location: "Victoria Peak",
    locationZh: "太平山",
    address: "Peak Road, Hong Kong",
    addressZh: "香港山顶道",
    lat: 22.2759,
    lng: 114.1455,
    date: "Sat · 5:30 AM",
    durationMin: 150,
    fee: 80,
    weather: "sunny",
    city: "Hong Kong",
    categories: ["outdoors", "wellness"],
    sensation: "calm",
    image: "/images/event-hike.jpg",
    organizer: "Alex Chen",
    organizerZh: "陈安安",
    organizerAvatar: "/images/avatar-user.jpg",
    experiencedCount: 186,
    favoritedCount: 142,
    participantCount: 4,
    maxParticipants: 8,
    relevance: 95,
    tags: ["hike", "coffee"],
  },
  {
    id: "night-market-crawl",
    title: "Night market food crawl",
    titleZh: "夜市小吃暴走团",
    summary: "Three districts, one hungry evening.",
    summaryZh: "三个街区，一个饿到发光的晚上。",
    description:
      "Follow a local guide through Temple Street and Mong Kok stalls — curry fish balls, egg waffles, and more.",
    descriptionZh:
      "跟着本地向导穿梭庙街与旺角摊位：咖喱鱼蛋、鸡蛋仔，还有你没试过的路边摊。",
    tip: "Bring cash and an empty stomach. Vegetarian options available.",
    tipZh: "带现金，空腹前来。有素食选项。",
    location: "Temple Street → Mong Kok",
    locationZh: "庙街 → 旺角",
    address: "Temple Street Night Market, Yau Ma Tei",
    addressZh: "油麻地庙街夜市",
    lat: 22.3058,
    lng: 114.1707,
    date: "Fri · 7:00 PM",
    durationMin: 180,
    fee: 150,
    weather: "any",
    city: "Hong Kong",
    categories: ["taste", "culture"],
    sensation: "curious",
    image: "/images/event-food.jpg",
    organizer: "Jordan Ng",
    organizerZh: "伍卓然",
    organizerAvatar: "/images/avatar-1.png",
    experiencedCount: 421,
    favoritedCount: 210,
    participantCount: 9,
    maxParticipants: 12,
    relevance: 92,
    tags: ["food", "night"],
  },
  {
    id: "pottery-bowl",
    title: "First pottery bowl on the wheel",
    titleZh: "第一次拉坯做一只碗",
    summary: "Two hours, clay under nails, one keepable bowl.",
    summaryZh: "两小时，指甲缝里的泥巴，带走一只碗。",
    description:
      "Beginner-friendly wheel session. Center clay, shape a bowl, pick a glaze. Pickup in two weeks.",
    descriptionZh:
      "零基础拉坯课：定中、成型、上釉。成品两周后可取。",
    tip: "Wear clothes you don't mind getting dirty.",
    tipZh: "穿不怕脏的衣服。",
    location: "Sham Shui Po Studio",
    locationZh: "深水埗陶艺工作室",
    address: "Apliu Street, Sham Shui Po",
    addressZh: "深水埗鸭寮街",
    lat: 22.3312,
    lng: 114.1628,
    date: "Sun · 2:00 PM",
    durationMin: 120,
    fee: 280,
    weather: "any",
    city: "Hong Kong",
    categories: ["creative", "comfort"],
    sensation: "calm",
    image: "/images/event-art.jpg",
    organizer: "Maya Lo",
    organizerZh: "卢玛雅",
    organizerAvatar: "/images/persona.png",
    experiencedCount: 98,
    favoritedCount: 76,
    participantCount: 6,
    maxParticipants: 10,
    relevance: 88,
    tags: ["craft", "indoor"],
  },
  {
    id: "urban-sketch",
    title: "Waterfront urban sketching",
    titleZh: "海旁城市速写漫步",
    summary: "Sketch architecture along the promenade.",
    summaryZh: "沿着海滨画下城市的轮廓。",
    description:
      "Three viewpoints, optional mini demos. Bring your own sketchbook.",
    descriptionZh: "三个观景点，可选小示范。自备速写本即可。",
    tip: "A fineliner and one gray marker are enough.",
    tipZh: "一支针管笔加一支灰色马克笔就够了。",
    location: "Tsim Sha Tsui Promenade",
    locationZh: "尖沙咀海滨长廊",
    address: "Salisbury Road, Tsim Sha Tsui",
    addressZh: "尖沙咀梳士巴利道",
    lat: 22.294,
    lng: 114.1722,
    date: "Sun · 10:00 AM",
    durationMin: 120,
    fee: 0,
    weather: "sunny",
    city: "Hong Kong",
    categories: ["creative", "outdoors"],
    sensation: "curious",
    image: "/images/event-park.jpg",
    organizer: "Leo Park",
    organizerZh: "朴利奥",
    organizerAvatar: "/images/avatar-user.jpg",
    experiencedCount: 154,
    favoritedCount: 118,
    participantCount: 5,
    maxParticipants: 12,
    relevance: 90,
    tags: ["art", "walk"],
  },
  {
    id: "language-boardgame",
    title: "Language exchange over board games",
    titleZh: "桌游里的语言交换局",
    summary: "Rotate tables: English, Mandarin, Cantonese.",
    summaryZh: "轮桌练习：英语、普通话、粤语。",
    description:
      "15-minute language pairs, then switch. Board games keep it low-pressure.",
    descriptionZh: "每轮 15 分钟语言对练，再换桌。桌游让气氛轻松。",
    tip: "No fluency required — curiosity is enough.",
    tipZh: "不要求流利，好奇就够了。",
    location: "Central co-working lounge",
    locationZh: "中环共享办公空间",
    address: "Queen's Road Central, Hong Kong",
    addressZh: "香港皇后大道中",
    lat: 22.281,
    lng: 114.155,
    date: "Wed · 6:30 PM",
    durationMin: 90,
    fee: 40,
    weather: "any",
    city: "Hong Kong",
    categories: ["social", "culture"],
    sensation: "curious",
    image: "/images/event-cafe.jpg",
    organizer: "Supp Community",
    organizerZh: "嘛呢社群",
    organizerAvatar: "/images/avatar-1.png",
    experiencedCount: 267,
    favoritedCount: 133,
    participantCount: 8,
    maxParticipants: 16,
    relevance: 86,
    tags: ["language", "games"],
  },
  {
    id: "silent-disco-ferry",
    title: "Silent disco on the harbour ferry",
    titleZh: "维港渡轮上的默契迪斯科",
    summary: "Headphones on, skyline dancing, strangers syncing.",
    summaryZh: "戴上耳机，对着天际线跳舞，陌生人同频。",
    description:
      "Board the evening ferry with wireless headphones. Three DJ channels. Dance or just watch the lights.",
    descriptionZh:
      "傍晚登船，无线耳机三频道 DJ。你可以跟着跳，也可以只看维港灯火。",
    tip: "Charge your phone — the headphone receiver uses Bluetooth.",
    tipZh: "手机充满电，耳机接收器靠蓝牙。",
    location: "Star Ferry Pier",
    locationZh: "天星码头",
    address: "Star Ferry Pier, Central",
    addressZh: "中环天星码头",
    lat: 22.2825,
    lng: 114.1614,
    date: "Sat · 8:00 PM",
    durationMin: 60,
    fee: 120,
    weather: "cloudy",
    city: "Hong Kong",
    categories: ["adrenaline", "social"],
    sensation: "intense",
    image: "/images/event-night.jpg",
    organizer: "Nova Beats",
    organizerZh: "新星节拍",
    organizerAvatar: "/images/persona.png",
    experiencedCount: 203,
    favoritedCount: 177,
    participantCount: 20,
    maxParticipants: 40,
    relevance: 84,
    tags: ["music", "night"],
  },
  {
    id: "rainy-bookstore",
    title: "Rainy-day bookstore treasure hunt",
    titleZh: "雨天书店寻宝",
    summary: "Find a book that finds you.",
    summaryZh: "找一本会找到你的书。",
    description:
      "Wander independent bookstores with a prompt card. Trade your find with another participant.",
    descriptionZh:
      "拿着提示卡逛独立书店，找到一本书后与另一位参与者交换。",
    tip: "Best on a rainy afternoon — the city slows down.",
    tipZh: "适合下雨的下午，城市会慢下来。",
    location: "Bloomsbury Books & more",
    locationZh: "多家独立书店",
    address: "Aberdeen Street, Central",
    addressZh: "中环鸭巴甸街",
    lat: 22.2835,
    lng: 114.1528,
    date: "Any rainy day · afternoon",
    durationMin: 90,
    fee: 0,
    weather: "rainy",
    city: "Hong Kong",
    categories: ["culture", "comfort"],
    sensation: "calm",
    image: "/images/hero-landscape.jpg",
    organizer: "Priya Shah",
    organizerZh: "普莉娅",
    organizerAvatar: "/images/avatar-user.jpg",
    experiencedCount: 145,
    favoritedCount: 201,
    participantCount: 3,
    maxParticipants: 15,
    relevance: 82,
    tags: ["books", "rain"],
  },
  {
    id: "rooftop-yoga",
    title: "Golden-hour rooftop yoga",
    titleZh: "黄昏天台瑜伽",
    summary: "Stretch above the streets as the sky turns gold.",
    summaryZh: "在金色天空下，在街头之上伸展。",
    description:
      "Beginner-friendly flow on a private rooftop. Mats provided. Bring water.",
    descriptionZh: "天台初级流瑜伽，提供垫子，自备水杯即可。",
    tip: "Arrive 10 minutes early for shoe storage.",
    tipZh: "提前 10 分钟到，方便放鞋。",
    location: "Sheung Wan rooftop",
    locationZh: "上环天台",
    address: "Des Voeux Road West, Sheung Wan",
    addressZh: "上环德辅道西",
    lat: 22.2878,
    lng: 114.1489,
    date: "Thu · 6:00 PM",
    durationMin: 60,
    fee: 100,
    weather: "sunny",
    city: "Hong Kong",
    categories: ["wellness", "outdoors"],
    sensation: "calm",
    image: "/images/me-bg.jpg",
    organizer: "Yuna Kim",
    organizerZh: "金俞娜",
    organizerAvatar: "/images/avatar-1.png",
    experiencedCount: 176,
    favoritedCount: 94,
    participantCount: 7,
    maxParticipants: 14,
    relevance: 80,
    tags: ["yoga", "sunset"],
  },
  {
    id: "midnight-photo",
    title: "Midnight neon photo walk",
    titleZh: "午夜霓虹摄影漫步",
    summary: "Chase signs, reflections, and empty alleys.",
    summaryZh: "追逐招牌、倒影，还有空荡的巷弄。",
    description:
      "Guided night photography walk through neon streets. Phone cameras welcome.",
    descriptionZh: "霓虹夜拍漫步，手机摄影也欢迎。",
    tip: "Clean your lens before you start — neon loves fingerprints.",
    tipZh: "出发前擦一下镜头，霓虹很怕指纹。",
    location: "Jordan → Yau Ma Tei",
    locationZh: "佐敦 → 油麻地",
    address: "Nathan Road, Jordan",
    addressZh: "佐敦弥敦道",
    lat: 22.3048,
    lng: 114.1719,
    date: "Sat · 11:00 PM",
    durationMin: 100,
    fee: 60,
    weather: "cloudy",
    city: "Hong Kong",
    categories: ["creative", "adrenaline"],
    sensation: "stimulating",
    image: "/images/event-night.jpg",
    organizer: "Kai Wong",
    organizerZh: "黄凯",
    organizerAvatar: "/images/persona.png",
    experiencedCount: 229,
    favoritedCount: 168,
    participantCount: 11,
    maxParticipants: 16,
    relevance: 91,
    tags: ["photo", "neon"],
  },
  {
    id: "shanghai-lane-breakfast",
    title: "Lane breakfast with strangers",
    titleZh: "弄堂早餐陌生人局",
    summary: "Share soy milk and youtiao with whoever shows up.",
    summaryZh: "谁来了，就一起喝豆浆吃油条。",
    description:
      "Morning meetup in a Shanghai lane. Order local breakfast, sit together, talk about firsts.",
    descriptionZh:
      "上海弄堂清晨集合，点本地早餐，围坐聊聊各自的“第一次”。",
    tip: "Come hungry; portions are generous.",
    tipZh: "空腹来，分量不小。",
    location: "Jing'an lane",
    locationZh: "静安弄堂",
    address: "Near West Nanjing Road, Shanghai",
    addressZh: "上海南京西路附近",
    lat: 31.2304,
    lng: 121.4737,
    date: "Sun · 8:00 AM",
    durationMin: 75,
    fee: 35,
    weather: "any",
    city: "Shanghai",
    categories: ["taste", "social"],
    sensation: "curious",
    image: "/images/event-food.jpg",
    organizer: "Lin Wei",
    organizerZh: "林薇",
    organizerAvatar: "/images/avatar-user.jpg",
    experiencedCount: 88,
    favoritedCount: 64,
    participantCount: 5,
    maxParticipants: 10,
    relevance: 78,
    tags: ["breakfast", "shanghai"],
  },
  {
    id: "tokyo-dawn-temple",
    title: "Dawn temple walk in quiet Tokyo",
    titleZh: "东京清晨安静的寺庙散步",
    summary: "Before the city wakes, walk and listen.",
    summaryZh: "在城市醒来之前，走一走，听一听。",
    description:
      "Early walk around Senso-ji outer paths. No tour talk — just presence and optional journaling.",
    descriptionZh:
      "浅草寺外圈清晨散步。没有导游讲解，只有在场，以及可选的手记。",
    tip: "Wear soft shoes; stone paths get slippery with dew.",
    tipZh: "穿软底鞋，露水会让石板路滑。",
    location: "Asakusa",
    locationZh: "浅草",
    address: "Asakusa, Taito City, Tokyo",
    addressZh: "东京都台东区浅草",
    lat: 35.7148,
    lng: 139.7967,
    date: "Daily · 5:45 AM",
    durationMin: 70,
    fee: 0,
    weather: "sunny",
    city: "Tokyo",
    categories: ["wellness", "culture"],
    sensation: "calm",
    image: "/images/hero-mountain.jpg",
    organizer: "Aya Sato",
    organizerZh: "佐藤彩",
    organizerAvatar: "/images/avatar-1.png",
    experiencedCount: 132,
    favoritedCount: 97,
    participantCount: 4,
    maxParticipants: 12,
    relevance: 75,
    tags: ["tokyo", "temple"],
  },
];

/** Hours from “now” when each demo idea starts (keeps the map populated). */
const START_OFFSET_HOURS = [1, 2.5, 4, 6, 9, 11, 13, 16, 20, -0.5, 3, 8];

export function engagementForIdea(
  idea: Pick<Idea, "sensation" | "categories"> & Partial<Pick<Idea, "engagement">>,
): Engagement {
  if (idea.engagement) return idea.engagement;
  if (idea.categories.includes("adrenaline")) return "high";
  if (idea.sensation === "intense" || idea.sensation === "stimulating") return "high";
  if (idea.sensation === "curious") return "medium";
  return "low";
}

/** Optional curated content — blank when missing. */
const IDEA_EXTRAS: Record<
  string,
  Partial<
    Pick<Idea, "steps" | "stepsZh" | "needs" | "needsZh" | "socialEmbeds">
  >
> = {
  "eavesdrop-headphones": {
    steps: [
      "Pick a busy but safe public spot (station concourse, café queue).",
      "Put headphones on and play soft music at a low volume.",
      "Tune your attention to nearby conversations without staring.",
      "After a few minutes, note one detail that changes how the city feels.",
    ],
    stepsZh: [
      "选一个热闹又安全的公共空间（车站大厅、咖啡队列）。",
      "戴上耳机，把音乐音量调低。",
      "不盯着别人，轻轻捕捉周围对话。",
      "几分钟后记下一个让你对这座城市感觉不一样的细节。",
    ],
    needs: ["Headphones", "A phone or music player", "5–10 free minutes"],
    needsZh: ["耳机", "手机或播放器", "空闲 5–10 分钟"],
    socialEmbeds: [
      {
        platform: "tiktok",
        url: "https://www.tiktok.com/@scout2015/video/6718339390082518274",
        embedUrl: "https://www.tiktok.com/embed/v2/6718339390082518274",
        title: "City listening challenge",
        titleZh: "城市偷听挑战",
      },
      {
        platform: "xiaohongshu",
        url: "https://www.xiaohongshu.com/explore",
        title: "Station people-watching",
        titleZh: "车站人来人往观察笔记",
      },
    ],
  },
  "pottery-bowl": {
    steps: [
      "Book a beginner wheel session and arrive 10 minutes early.",
      "Wedge the clay until air pockets are gone.",
      "Center on the wheel, then open and pull the walls evenly.",
      "Trim, stamp your mark, and leave it for firing.",
    ],
    stepsZh: [
      "预约新手拉坯课，提前 10 分钟到达。",
      "揉泥排气，直到没有气泡。",
      "泥条居中，再均匀开口拉高。",
      "修坯、盖章，等待烧制。",
    ],
    needs: ["Old clothes / apron", "Hair tie", "Phone for reference photos"],
    needsZh: ["旧衣服或围裙", "发绳", "手机（拍参考图）"],
    socialEmbeds: [
      {
        platform: "tiktok",
        url: "https://www.tiktok.com/@scout2015/video/6718339390082518274",
        embedUrl: "https://www.tiktok.com/embed/v2/6718339390082518274",
        title: "First bowl on the wheel",
        titleZh: "第一次拉坯成碗",
      },
    ],
  },
  "night-market-crawl": {
    steps: [
      "Pick 3 stalls before you start so you don’t over-order.",
      "Share plates if you go with friends; rotate one snack per stop.",
      "End with a sweet drink and a short walk to settle.",
    ],
    stepsZh: [
      "出发前先定 3 个摊位，避免点太多。",
      "结伴就拼盘，每一站只吃一样。",
      "用甜饮收尾，再散步消化。",
    ],
    needs: ["Cash / mobile pay", "Wet wipes", "Light appetite"],
    needsZh: ["现金或移动支付", "湿纸巾", "留一点胃口"],
    socialEmbeds: [
      {
        platform: "tiktok",
        url: "https://www.tiktok.com/@scout2015/video/6718339390082518274",
        embedUrl: "https://www.tiktok.com/embed/v2/6718339390082518274",
        title: "HK night market route",
        titleZh: "香港夜市路线",
      },
      {
        platform: "xiaohongshu",
        url: "https://www.xiaohongshu.com/explore",
        title: "Temple Street bites",
        titleZh: "庙街小吃清单",
      },
    ],
  },
};

export function withSchedule(
  idea: Omit<
    Idea,
    "startsAt" | "endsAt" | "engagement" | "steps" | "stepsZh" | "needs" | "needsZh" | "socialEmbeds"
  > &
    Partial<
      Pick<
        Idea,
        | "startsAt"
        | "endsAt"
        | "engagement"
        | "steps"
        | "stepsZh"
        | "needs"
        | "needsZh"
        | "socialEmbeds"
      >
    >,
  index = 0,
  nowMs = Date.now(),
): Idea {
  const engagement = engagementForIdea(idea);
  const seeded = IDEA_EXTRAS[idea.id] ?? {};
  const extras = {
    engagement,
    steps: idea.steps ?? seeded.steps ?? [],
    stepsZh: idea.stepsZh ?? seeded.stepsZh ?? [],
    needs: idea.needs ?? seeded.needs ?? [],
    needsZh: idea.needsZh ?? seeded.needsZh ?? [],
    socialEmbeds: idea.socialEmbeds ?? seeded.socialEmbeds ?? [],
  };
  if (idea.startsAt && idea.endsAt) {
    const end = Date.parse(idea.endsAt);
    if (Number.isFinite(end) && end > nowMs) {
      return {
        ...idea,
        ...extras,
        startsAt: idea.startsAt,
        endsAt: idea.endsAt,
      };
    }
  }
  const offsetH = START_OFFSET_HOURS[index % START_OFFSET_HOURS.length];
  const startMs = nowMs + offsetH * 60 * 60 * 1000;
  const endMs = startMs + Math.max(idea.durationMin, 45) * 60 * 1000;
  return {
    ...idea,
    ...extras,
    startsAt: new Date(startMs).toISOString(),
    endsAt: new Date(endMs).toISOString(),
  };
}

export const mockIdeas: Idea[] = mockIdeaSeeds.map((idea, i) =>
  withSchedule(idea, i),
);

export type Friend = {
  id: string;
  name: string;
  nameZh: string;
  avatar: string;
  overlap: number;
  bio: string;
  bioZh: string;
};

export const mockFriends: Friend[] = [
  {
    id: "f1",
    name: "Mira Zhou",
    nameZh: "周米拉",
    avatar: "/images/avatar-1.png",
    overlap: 87,
    bio: "Also into quiet social experiments & night walks.",
    bioZh: "同样喜欢安静的社交实验和夜逛。",
  },
  {
    id: "f2",
    name: "Theo Park",
    nameZh: "朴西奥",
    avatar: "/images/persona.png",
    overlap: 81,
    bio: "Collected 6 of the same ideas as you.",
    bioZh: "和你收藏了 6 个相同的点子。",
  },
  {
    id: "f3",
    name: "Sana Ali",
    nameZh: "萨娜",
    avatar: "/images/avatar-user.jpg",
    overlap: 74,
    bio: "Taste-bud hunter. Wants a food crawl buddy.",
    bioZh: "味蕾猎人，想找夜市搭子。",
  },
];

export type ExperiencedUser = {
  id: string;
  name: string;
  nameZh: string;
  avatar: string;
};

/** Pool of people who have marked ideas as experienced */
export const mockExperiencedUsers: ExperiencedUser[] = [
  { id: "f1", name: "Mira Zhou", nameZh: "周米拉", avatar: "/images/avatar-1.png" },
  { id: "f2", name: "Theo Park", nameZh: "朴西奥", avatar: "/images/persona.png" },
  { id: "f3", name: "Sana Ali", nameZh: "萨娜", avatar: "/images/avatar-user.jpg" },
  {
    id: "demo001",
    name: "Kai Wong",
    nameZh: "黄凯",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=96&h=96&q=80",
  },
  {
    id: "demo002",
    name: "Lina Chen",
    nameZh: "陈丽娜",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=96&h=96&q=80",
  },
  {
    id: "demo003",
    name: "Noah Kim",
    nameZh: "金诺亚",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&h=96&q=80",
  },
  {
    id: "demo004",
    name: "Aya Sato",
    nameZh: "佐藤彩",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=96&h=96&q=80",
  },
  {
    id: "demo005",
    name: "Diego Ruiz",
    nameZh: "迭戈",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=96&h=96&q=80",
  },
  {
    id: "demo006",
    name: "Hana Lee",
    nameZh: "李荷娜",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=96&h=96&q=80",
  },
  {
    id: "demo007",
    name: "Omar Hassan",
    nameZh: "奥马尔",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=96&h=96&q=80",
  },
  {
    id: "demo008",
    name: "Yuna Park",
    nameZh: "朴宥娜",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=96&h=96&q=80",
  },
  {
    id: "demo009",
    name: "Ben Carter",
    nameZh: "本·卡特",
    avatar:
      "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=96&h=96&q=80",
  },
  {
    id: "demo010",
    name: "Mei Lin",
    nameZh: "林美",
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=96&h=96&q=80",
  },
  {
    id: "demo011",
    name: "Ravi Patel",
    nameZh: "拉维",
    avatar:
      "https://images.unsplash.com/photo-1507591064344-4c6ce005bff4?auto=format&fit=crop&w=96&h=96&q=80",
  },
  {
    id: "demo012",
    name: "Sofia Berg",
    nameZh: "索菲亚",
    avatar:
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=96&h=96&q=80",
  },
  {
    id: "demo013",
    name: "Jun Wei",
    nameZh: "俊伟",
    avatar:
      "https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=96&h=96&q=80",
  },
  {
    id: "demo014",
    name: "Elena Rossi",
    nameZh: "埃琳娜",
    avatar:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=96&h=96&q=80",
  },
  {
    id: "demo015",
    name: "Tom Hughes",
    nameZh: "汤姆",
    avatar:
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=96&h=96&q=80",
  },
];

/** Deterministic experienced-user list for an idea (scrollable on detail page). */
export function getExperiencedUsersForIdea(ideaId: string): ExperiencedUser[] {
  const seed = [...ideaId].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const count = 8 + (seed % 9); // 8–16 people
  const start = seed % mockExperiencedUsers.length;
  const list: ExperiencedUser[] = [];
  for (let i = 0; i < count; i++) {
    list.push(mockExperiencedUsers[(start + i) % mockExperiencedUsers.length]);
  }
  return list;
}

export const mockUser = {
  name: "Guoqiang",
  nameZh: "国强啊国强",
  avatar: "/images/avatar-user.jpg",
  experienced: 124,
  favorited: 72,
  claimed: 2,
  percentile: 97.3,
  persona: "Analyst / Thinker",
  personaZh: "分析家 / 思考者",
  personaDesc:
    "You value facts and detail. Experiences that involve observation and reasoning light you up.",
  personaDescZh:
    "重视事实和数据，对细节和推理有关的体验很感兴趣。随着体验更多项目，你的体验角色可能会变。",
  favoritedIds: [
    "eavesdrop-headphones",
    "sunrise-hike",
    "night-market-crawl",
    "rainy-bookstore",
  ],
  experiencedIds: ["eavesdrop-headphones", "urban-sketch", "language-boardgame"],
  joinedIds: ["sunrise-hike", "pottery-bowl"],
};

export function getIdeaById(id: string): Idea | undefined {
  return mockIdeas.find((idea) => idea.id === id);
}

export function getTopRecommendations(limit = 10): Idea[] {
  return [...mockIdeas].sort((a, b) => b.relevance - a.relevance).slice(0, limit);
}

export type SearchFilters = {
  query?: string;
  city?: string;
  weather?: string;
  fee?: string;
  duration?: string;
  category?: string;
  /** Sightseeing, local food, gatherings for visitors */
  travellerMode?: boolean;
  /** Solo-friendly ideas that don't need a group */
  introvertMode?: boolean;
};

export function searchIdeas(filters: SearchFilters = {}): Idea[] {
  const q = filters.query?.trim().toLowerCase() ?? "";

  return mockIdeas.filter((idea) => {
    if (q) {
      const hay = [
        idea.title,
        idea.titleZh,
        idea.summary,
        idea.summaryZh,
        idea.location,
        idea.locationZh,
        ...idea.tags,
        ...idea.categories,
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }

    if (filters.city && filters.city !== "any" && idea.city !== filters.city) {
      return false;
    }

    if (
      filters.weather &&
      filters.weather !== "any" &&
      idea.weather !== "any" &&
      idea.weather !== filters.weather
    ) {
      return false;
    }

    if (filters.category && filters.category !== "any") {
      if (!idea.categories.includes(filters.category as Category)) return false;
    }

    if (filters.fee && filters.fee !== "any") {
      if (filters.fee === "free" && idea.fee !== 0) return false;
      if (filters.fee === "under100" && !(idea.fee > 0 && idea.fee <= 100))
        return false;
      if (filters.fee === "over100" && !(idea.fee > 100)) return false;
    }

    if (filters.duration && filters.duration !== "any") {
      if (filters.duration === "short" && idea.durationMin > 30) return false;
      if (
        filters.duration === "medium" &&
        !(idea.durationMin > 30 && idea.durationMin <= 120)
      )
        return false;
      if (filters.duration === "long" && idea.durationMin <= 120) return false;
    }

    return true;
  });
}

export function ideasWithAddress(): Idea[] {
  return mockIdeas.filter((idea) => Number.isFinite(idea.lat) && Number.isFinite(idea.lng));
}

export function localizedIdea(idea: Idea, locale: string) {
  const zh = locale === "zh";
  return {
    title: zh ? idea.titleZh : idea.title,
    summary: zh ? idea.summaryZh : idea.summary,
    description: zh ? idea.descriptionZh : idea.description,
    tip: zh ? idea.tipZh : idea.tip,
    location: zh ? idea.locationZh : idea.location,
    address: zh ? idea.addressZh : idea.address,
    organizer: zh ? idea.organizerZh : idea.organizer,
    categories: idea.categories.map((c) =>
      zh ? categoryMeta[c].labelZh : categoryMeta[c].label,
    ),
    sensation: zh
      ? sensationMeta[idea.sensation].labelZh
      : sensationMeta[idea.sensation].label,
    steps: (zh ? idea.stepsZh : idea.steps) ?? [],
    needs: (zh ? idea.needsZh : idea.needs) ?? [],
  };
}
