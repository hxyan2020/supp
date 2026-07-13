# Supp (嘛呢)

Experience idea database — discover ideas worth joining.

## Live preview

While the local server is running, the app is also exposed at a public Cloudflare tunnel URL (see chat for the current link). Permanent hosting: connect the GitHub repo to Vercel.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- next-intl (9 languages)
- Leaflet maps — OpenStreetMap globally, Amap tiles for Chinese locale
- Design language from Mockplus RP「嘛呢一期」
- File-backed admin store + event scraper pipeline

## Navigation (app)

| Tab | Route | What it does |
|-----|-------|----------------|
| **Explore** | `/[locale]/explore` | Top 10 preference matches + filter search |
| **Map** | `/[locale]/map` | Ideas with addresses as map pins |
| **Me** | `/[locale]/me` | Profile, joined/saved ideas, friends, language |
| **Idea detail** | `/[locale]/ideas/[id]` | Hero, actions, tip card, comments |

## Admin backend

| Page | Route |
|------|-------|
| Login | `/admin/login` |
| Dashboard | `/admin` |
| Ideas CRUD | `/admin/ideas` |
| Users CRUD | `/admin/users` |
| Scrape queue (review → publish) | `/admin/scraped` |
| Top-30 sources advisory | `/admin/sources` |

Default password: `supp-admin-dev` (override with `ADMIN_PASSWORD`).

### Scraper workflow

1. Open `/admin/scraped` → **Run scraper** (or `npm run scrape -- --country JP`)
2. Review pending events, edit title/description
3. **Publish to Supp** → appears on Explore/Map
4. Full platform advisory: [`docs/EVENT_SOURCES_TOP30.md`](docs/EVENT_SOURCES_TOP30.md)

## Languages

English (default), 中文 (嘛呢), Français, Español, العربية, Русский, 日本語, 한국어, Bahasa Indonesia

## Develop

```bash
npm install
npm run dev
```

Open [http://localhost:7502](http://localhost:7502).

## Deploy

```bash
npx vercel --prod
```

Or import https://github.com/hxyan2020/supp on [vercel.com/new](https://vercel.com/new).
