# Event publication platforms — Top 30 economies

Advisory reference for Supp's scrape → review → publish pipeline.  
GDP ranks from IMF WEO 2025 estimates. Platforms listed are **consumer/community discovery** leaders, not enterprise-only (Cvent, Bizzabo).

## How to use this list

| Priority | Action |
|----------|--------|
| **P1 — Scrape now** | Eventbrite, Meetup, AllEvents, Luma, Peatix, Sympla, Humanitix, Skiddle, Eventpop, KKTIX (adapters in `src/scraper/runner.ts`) |
| **P2 — Partner API / manual** | Damai, BookMyShow, Ticketmaster, Interpark, Biletix — high value but ToS/API restrictions |
| **P3 — Regional aggregator** | Shotgun, Xceed, Rausgegangen, Passline, Platinumlist, WeBook |

**Legal note:** Always respect `robots.txt`, site Terms of Service, and rate limits. Prefer official APIs/partner feeds for production. The built-in scraper is for **admin review ingestion**, not high-volume crawling.

---

## Global (all markets)

| Platform | URL | Best for | Scrape |
|----------|-----|----------|--------|
| **Eventbrite** | eventbrite.com | Largest consumer marketplace | ✅ Discovery pages |
| **Meetup** | meetup.com | Recurring communities & hobbies | ✅ Search pages |
| **AllEvents** | allevents.in | Cross-platform aggregator (160+ countries) | ✅ HTML list |
| **Luma** | lu.ma | Tech/creator/community RSVPs | ✅ Discover page |
| **DICE** | dice.fm | Live music & nightlife | ✅ Browse |

---

## By economy (Top 30)

### 1. United States 🇺🇸
- **Eventbrite** — default discovery
- **Ticketmaster** — concerts/sports (partner API)
- **Meetup** — community
- **DICE** — music venues
- **Eventbrite Alternatives:** Luma, Partiful, Ticket Tailor

### 2. China 🇨🇳
- **Damai 大麦** — dominant ticketing (170M+ users)
- **Maoyan 猫眼** — film + live entertainment
- **ShowStart 秀动** — indie music/youth
- **Maiseat** — Damai international expansion

### 3. Germany 🇩🇪
- **Eventim** — DACH ticketing leader
- **Rausgegangen** — indie/free Berlin/Munich/Cologne
- **Eventbrite DE**

### 4. India 🇮🇳
- **BookMyShow** — ~55% live events share
- **District (Zomato)** — fast-growing (ex-Paytm Insider)
- **Townscript** — conferences/workshops (UPI)
- **KonfHub** — tech/dev meetups

### 5. Japan 🇯🇵
- **Peatix** — #1 community platform (5.6M participants/yr)
- **PassMarket (Yahoo)** — seminars/classes
- **Interpark / NOL** — concerts & theatre

### 6. United Kingdom 🇬🇧
- **Skiddle** — nightlife & festivals
- **Fatsoma** — club/student events
- **Eventbrite UK**
- **Ticketmaster UK**

### 7. France 🇫🇷
- **Fnac Spectacles** — major ticketing
- **Shotgun** — electronic/nightlife
- **Eventbrite FR**

### 8. Italy 🇮🇹
- **TicketOne** — live entertainment leader
- **Eventbrite IT**

### 9. Russia 🇷🇺
- **Afisha** — culture/events guide (Moscow, SPb)
- **Time Out Moscow** (editorial + listings)

### 10. Canada 🇨🇦
- **Eventbrite CA**
- **Ticketmaster CA**
- **TicketPro** — regional

### 11. Brazil 🇧🇷
- **Sympla** — leading self-service (200K+ events)
- **Ingresso.com** — major entertainment
- **Eventbrite BR**

### 12. Spain 🇪🇸
- **Entradas.com** — concerts/sports
- **Xceed** — nightlife (also Ibiza/Barcelona)
- **Eventbrite ES**

### 13. South Korea 🇰🇷
- **Interpark / NOL** — K-pop & live events
- **Festa** — community workshops
- **Peatix KR**

### 14. Australia 🇦🇺
- **Humanitix** — community (charity-forward)
- **Moshtix** — live music/festivals
- **Eventbrite AU**

### 15. Mexico 🇲🇽
- **Boletia** — leading self-service
- **Eventbrite MX**

### 16. Turkey 🇹🇷
- **Biletix** (Ticketmaster JV) — dominant
- **Etko** — local aggregator

### 17. Indonesia 🇮🇩
- **Eventbrite ID**
- **Loket.com** — ticketing
- **Peatix ID**

### 18. Netherlands 🇳🇱
- **Ticketmaster NL**
- **Eventbrite NL**

### 19. Saudi Arabia 🇸🇦
- **WeBook** — entertainment (Vision 2030)
- **Platinumlist** (GCC)

### 20. Poland 🇵🇱
- **eBilet** — concerts/culture
- **Eventbrite PL**

### 21. Switzerland 🇨🇭
- **Ticketcorner** — CH leader
- **Eventbrite CH**

### 22. Taiwan 🇹🇼
- **KKTIX** — community/indie leader
- **Accupass** — classes/experiences

### 23. Belgium 🇧🇪
- **Eventbrite BE**
- **Ticketmaster BE**

### 24. Argentina 🇦🇷
- **Passline** — self-service leader
- **Eventbrite AR**

### 25. Sweden 🇸🇪
- **Ticketmaster SE**
- **Eventbrite SE**

### 26. Ireland 🇮🇪
- **Ticketmaster IE**
- **Eventbrite IE**

### 27. UAE 🇦🇪
- **Platinumlist** — concerts/experiences GCC
- **Eventbrite AE**

### 28. Singapore 🇸🇬
- **Eventbrite SG**
- **Peatix SG**
- **SISTIC** — major ticketing

### 29. Israel 🇮🇱
- **Get-in / Eventbuzz** — nightlife/live
- **Eventbrite IL**

### 30. Thailand 🇹🇭
- **Eventpop** — indie/community leader
- **ThaiTicketMajor** — major concerts

---

## Scraper architecture (Supp)

```
npm run scrape -- --country JP --limit 8
        ↓
src/scraper/runner.ts  (Eventbrite / Meetup / HTML adapters)
        ↓
data/store/db.json     (scrapedEvents[], status: pending)
        ↓
/admin/scraped         (you review, edit title/description)
        ↓
Publish → ideas[]      (live on /en/explore, /zh/explore, etc.)
```

### Admin access

- URL: `/admin/login`
- Default dev password: `supp-admin-dev`
- Production: set `ADMIN_PASSWORD` in environment

### Recommended production upgrades

1. **Official APIs** — Eventbrite API, Meetup Pro API where available
2. **Queue worker** — BullMQ / cron for scheduled country scrapes
3. **Postgres** — replace JSON store for multi-instance deploys
4. **Geocoding** — Google Geocoding / Amap for lat/lng backfill
5. **Deduplication** — fuzzy match on title + date + venue

---

## Sources consulted

- IMF World Economic Outlook 2025 (GDP ranking)
- Event Tech Live — [Eventbrite Alternatives: A Global Guide](https://eventtechlive.com/eventbrite-alternatives-a-global-guide/)
- SearchCompared — [Best Event Search Engines 2026](https://searchcompared.com/events/)
- Damai Holdings IR, Peatix About, BookMyShow market reports
