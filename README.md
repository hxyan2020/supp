# Supp (嘛呢)

An experience idea database — search for interesting ideas to participate in.

## Stack

- [Next.js](https://nextjs.org) (App Router)
- [next-intl](https://next-intl.dev) for i18n
- Tailwind CSS

## Languages

English (default), 中文, Français, Español, العربية, Русский, 日本語, 한국어, Bahasa Indonesia

## Pages

| Route | Description |
|-------|-------------|
| `/[locale]/explore` | Browse and search ideas |
| `/[locale]/ideas/[id]` | Idea detail |
| `/[locale]/me` | Saved & joined experiences |
| `/[locale]/account` | Profile, language, settings |

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:7502](http://localhost:7502) — you'll be redirected to `/en/explore`.

## Project structure

```
src/
├── app/[locale]/     # Localized routes
├── components/       # UI components
├── data/             # Mock data (replace with API later)
├── i18n/             # Routing & navigation
└── messages/         # Translation files
```
