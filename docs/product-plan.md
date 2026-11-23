# Kambu — product and technical plan

**Goal.** One place where Angolan importers ("revendedores") publish their group carts on Shein, Zara, AliExpress, Amazon and others, and buyers pay in kwanzas. Buyers see the importer's exchange rate, the closing date and the order's status until pickup. Kambu ships first as a **webapp**, then as **Android and iOS apps**.

**Problem today.** All of this happens in WhatsApp groups and Instagram stories. The rate changes between messages, nobody knows when the cart closes, importers keep the order list in notes or spreadsheets, and they answer "já chegou?" dozens of times a day.

---

## 1. Roles

| Role | Does |
|---|---|
| **Comprador** (buyer) | Browses carts, adds items, pays in Kz, tracks, rates |
| **Revendedor** (importer) | Creates carts, sets the rate and fees, confirms items and payments, updates the status |
| **Admin** | Verifies importers, handles disputes, moderation |

## 2. Cart lifecycle

One state machine, shown the same way on the web, in the apps and in notifications:

```
rascunho → aberto → fechado → encomendado → em_transito → em_luanda → pronto_levantamento → concluido
                 ↘ cancelado (from any state before encomendado)
```

| State | Meaning | Buyer can |
|---|---|---|
| `rascunho` | Importer is setting it up | — |
| `aberto` | Accepting items until `closes_at` | Add/edit items, pay |
| `fechado` | Deadline passed, **rate locked** | Pay the balance only |
| `encomendado` | Order placed at the store; sold-out items flagged | See flagged items, refund status |
| `em_transito` | Left the store's warehouse | Track |
| `em_luanda` | Arrived, customs clearance | Track |
| `pronto_levantamento` | Sorted, ready at a pickup point | See pickup point/time |
| `concluido` | All items handed over | Rate the importer |

Every transition inserts a `cart_events` row (state, note, optional photo, timestamp) and notifies participants. Closing happens automatically at `closes_at` (scheduled job). Items also have their own state: `pendente → confirmado → encomendado → esgotado | entregue`.

## 3. MVP features (webapp)

**Importer**
- Create a cart: store, currency (USD/EUR/CNY/GBP), **Kz rate**, shipping fee (per kg and/or per item), service fee, closing date-time, minimum/maximum items, pickup points, payment instructions (IBAN, Multicaixa Express number).
- Shareable public cart page (`kambu.ao/c/<slug>`) with Open Graph preview for WhatsApp.
- Item list per buyer; confirm or flag items; export CSV for ordering.
- Mark payments as confirmed (after checking the proof).
- Update the status once for the whole cart, with a note and photo.
- Change the rate while the cart is `aberto` (logged in `cart_rate_history`, buyers notified).

**Buyer**
- Browse and filter open carts (store, closing soon, rate, importer rating).
- Add items: paste a link, size, colour, qty, price in the original currency → automatic Kz total including fees.
- Upload proof of payment (image/PDF).
- "Os meus carrinhos" with a timeline per cart; notifications.
- Rate the importer after `concluido`.

**Platform**
- Optional reference rate (e.g. BNA, fetched daily) displayed next to the importer's rate, **informational only**.
- Importer verification (ID + phone + first carts reviewed by admin), badge on profile.

## 4. Stack

| Layer | Choice | Why |
|---|---|---|
| Webapp | **Next.js (App Router) + TypeScript + Tailwind**, installable **PWA**, on **Vercel** | SSR for shareable cart pages (WhatsApp previews), same host as the landing |
| Backend | **Supabase**: Postgres + Row-Level Security, Auth, Storage, Realtime, Edge Functions, Cron | Managed, cheap at the start, RLS fits buyer/importer separation |
| Auth | Phone OTP (main, since most users live on WhatsApp) + email | |
| Files | Supabase Storage: payment proofs (private), status photos (cart participants) | |
| Notifications | Web Push → Expo push in the apps; email via Resend; WhatsApp/SMS later | |
| Payments | **Phase 1: manual** (transfer / Multicaixa Express + proof upload, importer confirms). **Phase 2:** Angolan gateway with payment references (e.g. EMIS/GPO, ProxyPay) | Ship without needing a payment licence |
| Mobile | **Expo (React Native)** + Expo Router, EAS Build/Submit/Update | One codebase for Android and iOS; shares types and API client with web |
| CI | GitHub Actions: lint, typecheck, tests, Supabase migrations | |

## 5. Data model (Postgres)

| Table | Key fields |
|---|---|
| `profiles` | id (auth), name, phone, avatar, role |
| `importers` | profile_id, display_name, slug, verified_at, rating_avg, rating_count, payment_instructions |
| `carts` | id, importer_id, slug, title, store, currency, rate_kz, fee_per_kg_kz, fee_per_item_kz, service_fee_pct, min_items, max_items, closes_at, eta_text, status, rate_locked_at |
| `cart_rate_history` | cart_id, rate_kz, changed_at |
| `pickup_points` | importer_id, name, area (bairro), address, hours |
| `cart_items` | cart_id, buyer_id, url, title, variant (size/colour), qty, price_foreign, est_weight_kg, price_kz, status |
| `payments` | cart_id, buyer_id, amount_kz, method, proof_path, status, confirmed_by, confirmed_at |
| `cart_events` | cart_id, status, note, photo_path, created_by, created_at |
| `reviews` | cart_id, buyer_id, importer_id, stars, comment |
| `notifications` | user_id, type, payload, read_at |
| `push_tokens` | user_id, platform, token |

RLS: buyers see public cart data plus only **their own** items and payments; importers see everything in their carts; payment proofs are readable only by the owner and that cart's importer.

The Kz price is **computed on the server** from the cart rate (`price_foreign × rate_kz` + fees) and stored. When the cart closes, `rate_locked_at` is set and the totals are frozen.

## 6. Repository evolution

Today the repo is the static landing page at the root. When the webapp starts, turn it into a monorepo:

```
kambu/
├─ apps/
│  ├─ landing/   ← current index.html, styles.css, main.js, favicon.svg
│  ├─ web/       ← Next.js webapp (later absorbs the landing page)
│  └─ mobile/    ← Expo app
├─ packages/
│  └─ shared/    ← types generated from Supabase, Kz price calculation, status labels
├─ supabase/
│  ├─ migrations/
│  ├─ functions/ ← close-carts cron, notify, reference-rate fetch
│  └─ seed.sql
└─ docs/
```

Set each Vercel project's **Root Directory** (`apps/landing`, `apps/web`).

## 7. Roadmap

| Milestone | Scope |
|---|---|
| **M0 — now** | Landing page live on Vercel. Waitlist by email. Interview 5–10 importers about their current flow, fees and pain points. |
| **M1 — webapp MVP** | Auth, importer creates and shares a cart, buyers add items, Kz calculation, manual payments with proof, status timeline, auto-close. Pilot with 2–3 importers. |
| **M2 — trust & retention** | Notifications (web push + email), reviews, importer verification, rate history, CSV export, pickup points. |
| **M3 — mobile apps** | Expo app for **Android first** (larger share in Angola), then iOS. Push notifications, camera for proof upload. |
| **M4 — money & scale** | Integrated payment references, importer subscription or per-cart fee, shipment tracking numbers, importer analytics. |

## 8. Risks and open questions

- **Trust and fraud.** Kambu doesn't hold money in phase 1, so it can't guarantee deliveries. Mitigate with verification, public history and reviews. Holding funds (escrow-like) needs legal advice first.
- **Foreign exchange rules.** Showing an importer's own rate is a price, not an FX service, but check the BNA rules before integrating payments or showing official rates.
- **Rate volatility.** Lock the rate at closing; log and notify every change while the cart is open.
- **Customs delays.** Keep `em_luanda` honest with notes and photos; let the importer extend the ETA.
- **Business model** (to validate in M0 interviews): free for buyers, then a monthly plan or small per-cart fee for importers.
