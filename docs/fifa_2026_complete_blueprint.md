# FIFA World Cup 2026 Fixtures & PWA Notification App
## Technical Project Blueprint & Action Plan

This document serves as the complete technical architecture and execution roadmap for building and deploying a lightweight, production-ready FIFA World Cup 2026 tournament web application. Delivery is **phased**: **Phase 1 ships only day-wise fixtures**—the simplest, highest-value view. The frontend and API are built as a **widget platform** from day one so Hub, Livescore, Bracket, Teams, and Live Standings modules can be plugged in later without rewrites. Notification **Settings** (team follows, push, SMS) are a later phase—built on the same extensible shell.

---

## Implementation Status Tracker

> **How to use:** Check off items as they ship. Change `[ ]` → `[x]` for a completed item.  
> **Last updated:** 2026-06-10 — Phase 7.1 reminder timing code complete

### Phase overview

| Phase | Scope | Status |
| :--- | :--- | :--- |
| **1** | Day-wise Fixtures (MVP) | `[x]` Code complete — deploy pending |
| **2** | Hub Widget | `[ ]` Not started |
| **3** | Livescore Widget | `[ ]` Not started |
| **4** | Bracket Widget | `[ ]` Not started |
| **5** | Teams Widget | `[ ]` Not started |
| **6** | Live Standings Widget | `[ ]` Not started |
| **7** | Settings + Notifications | `[x]` Code complete — deploy pending |
| **7.1** | Reminder timing preference | `[x]` Code complete — deploy pending |

---

### Infrastructure & DevOps

- [ ] Neon.tech Postgres cluster provisioned _(manual — see README)_
- [x] `fixtures` table managed via TypeORM entity + migration
- [x] NestJS API project scaffolded (Render-ready)
- [x] TypeORM configured with Neon connection and versioned migrations
- [ ] Sportmonks API key configured in env _(set `SPORTMONKS_API_KEY` in `api/.env`)_
- [x] Vite + React frontend scaffolded
- [ ] Frontend deployed (Vercel / Netlify)
- [ ] Backend deployed (Render)
- [ ] End-to-end smoke test (app loads → fixtures visible)

---

### Phase 1 — MVP: Day-Wise Fixtures

**Backend**

- [x] `GET /api/fixtures` endpoint implemented
- [x] On-demand Sportmonks hydration (empty DB → fetch → upsert)
- [x] Serve from Postgres when data exists (skip Sportmonks)
- [x] Fixtures sorted chronologically in response
- [x] Manual re-sync path documented / tested (clear table → re-hydrate)

**Frontend — Widget shell**

- [x] `src/shell/` — AppShell, Header, WidgetRouter
- [x] `src/shell/registry.ts` — widget registry + `TournamentWidget` contract
- [x] Only Fixtures widget registered (no extra nav tabs)
- [x] Phase 1 header: title only, no Settings gear

**Frontend — Fixtures widget (`src/widgets/fixtures/`)**

- [x] `useFixtures()` hook — fetches `GET /api/fixtures`
- [x] Skeleton loader during API cold start
- [x] Day-wise date grouping (localized headings)
- [x] Match card — number, kickoff time, stage, home vs away, venue
- [x] Empty state with **Refresh** button
- [x] No team highlights, filters, or Settings link (Phase 1 scope)

**Phase 1 complete**

- [ ] **Phase 1 signed off** — day-wise schedule live in production _(pending Neon + Render + Vercel deploy)_

---

### Phase 2 — Hub Widget

- [ ] `GET /api/hub` aggregated endpoint
- [ ] `src/widgets/hub/` — dashboard composer
- [ ] Compact Fixtures preview embedded
- [ ] Compact Standings preview embedded (stub OK until Phase 6)
- [ ] Compact Bracket preview embedded (stub OK until Phase 4)
- [ ] Top scorers section (stub or live)
- [ ] Teams quick-links section (stub OK until Phase 5)
- [ ] Hub tab enabled in widget registry
- [ ] **Phase 2 signed off**

---

### Phase 3 — Livescore Widget

- [ ] Livescore DB tables / schema
- [ ] `GET /api/livescore` endpoint
- [ ] `GET /api/livescore/:fixtureId` endpoint
- [ ] Sportmonks live score sync (polling or webhook)
- [ ] `src/widgets/livescore/` — real-time score cards
- [ ] Minute-by-minute event timeline
- [ ] Mobile-optimized layout
- [ ] Livescore tab enabled in widget registry
- [ ] **Phase 3 signed off**

---

### Phase 4 — Bracket Widget

- [ ] Bracket DB tables / schema
- [ ] `GET /api/bracket` endpoint
- [ ] Sportmonks bracket hydration
- [ ] `src/widgets/bracket/` — visual knockout tree
- [ ] Auto-refresh when matches complete
- [ ] Bracket tab enabled in widget registry
- [ ] **Phase 4 signed off**

---

### Phase 5 — Teams Widget

- [ ] Teams / players DB tables
- [ ] `GET /api/teams` — all 48 national teams
- [ ] `GET /api/teams/:id/squad` — roster + player profiles
- [ ] Sportmonks squad hydration
- [ ] `src/widgets/teams/` — team browser
- [ ] Player profiles — position, stats
- [ ] Teams tab enabled in widget registry
- [ ] **Phase 5 signed off**

---

### Phase 6 — Live Standings Widget

- [ ] Standings DB tables
- [ ] `GET /api/standings/groups` endpoint
- [ ] `GET /api/standings/knockout` endpoint
- [ ] Live group table updates as matches play
- [ ] Knockout qualification indicators
- [ ] `src/widgets/standings/` — live group tables
- [ ] Standings tab enabled in widget registry
- [ ] **Phase 6 signed off**

---

### Phase 7 — Settings & Notifications

**Database**

- [x] `users` table migration authored
- [x] `followed_teams` table migration authored
- [x] `reminder_dispatches` dedupe table migration authored
- [ ] Migrations applied in Neon _(run `npm run migration:run` before deploy)_

**Backend**

- [x] `GET /api/teams/names` — Settings team picker
- [x] `PUT /api/user/settings` — save profile + preferences
- [x] `GET /api/user/vapid-public-key` — client push subscription
- [ ] VAPID keys generated and configured in `api/.env` _(manual)_
- [x] Web Push dispatch on reminder cron
- [ ] ~~Twilio SMS integration~~ _(deferred — Web Push only, $0 cost)_
- [x] `POST /api/fixtures/check-reminders` cron endpoint (protected by `X-Cron-Secret`)
- [ ] Cron-Job.org scheduler configured (10–15 min interval) _(manual post-deploy)_

**Frontend — Settings (`src/features/settings/`)**

- [x] Settings route `/settings`
- [x] Settings gear in app shell header
- [x] Name input (`userName`)
- [x] Team multi-select with search (from `GET /api/teams/names`)
- [x] Push notifications toggle + browser permission flow
- [ ] ~~SMS toggle + phone number input~~ _(deferred — Web Push only)_
- [x] Save button → `PUT /api/user/settings` + toast
- [x] Preferences cached in `localStorage`
- [x] iOS Add-to-Home-Screen helper for push opt-in

**PWA**

- [x] `public/manifest.json` configured
- [x] App icons (192×192, 512×512) + badge
- [x] `public/sw.js` — push + notificationclick handlers
- [x] Service worker registered from Settings (push opt-in)

**Fixtures widget (Phase 7 addition)**

- [x] Followed-team highlight on match cards

- [ ] **Phase 7 signed off** — notifications live in production _(pending migration + deploy + VAPID + cron)_

---

### Phase 7.1 — Reminder Timing Preference

Users choose **how far ahead of kickoff** they receive a push alert. Default is **5 minutes before** the match; power users can opt into earlier heads-up (e.g. **1 day before**).

**Database**

- [x] `users.reminder_minutes_before` column (`INT NOT NULL DEFAULT 5`)
- [x] Migration authored (`1749523500000-AddReminderMinutesBefore.ts`)
- [ ] Migration applied in Neon _(run `npm run migration:run` before deploy)_

**Backend**

- [x] `PUT /api/user/settings` accepts `reminderMinutesBefore` (preset minutes enum)
- [x] `ReminderService` uses **per-user** lead time instead of global fixed offset
- [x] Cron groups users by lead-time bucket for efficient fixture queries
- [x] Push body reflects chosen lead time (e.g. *"kicks off in ~5 minutes"* vs *"about 1 day"*)
- [x] Unit tests for preset validation + per-bucket dispatch + dedupe

**Frontend — Settings (`src/features/settings/`)**

- [x] **When to notify** control (visible when push toggle is on)
- [x] Preset picker with human labels (default selected: **5 minutes before**)
- [x] Preference cached in `localStorage` alongside teams/name
- [x] Helper text explaining one alert per match at the chosen time

**Presets (product contract)**

| UI label | `reminderMinutesBefore` | Use case |
| :--- | :--- | :--- |
| 5 minutes before *(default)* | `5` | Last-minute heads-up |
| 15 minutes before | `15` | Time to open the app |
| 1 hour before | `60` | Plan viewing around the match |
| 3 hours before | `180` | Afternoon/evening schedule check |
| 1 day before | `1440` | Calendar-style reminder |

- [ ] **Phase 7.1 signed off** — timing preference live in production _(pending migration + deploy)_

---

## 1. Cloud Infrastructure & Cost Management

To host this application completely free of charge while ensuring production stability, we leverage a distributed serverless and micro-container stack.

| Component | Provider | Tier Details | Role / Constraints Strategy |
| :--- | :--- | :--- | :--- |
| **Frontend** | **Vercel** or **Netlify** | Hobby Tier (Always Free) | Hosts the compiled Vite + TypeScript SPA and static assets. Provides edge CDN performance with $0 overhead. |
| **Backend API** | **Render** | Web Services Free Tier | Hosts the NestJS API engine. Note: Spinning down happens after 15 minutes of inactivity (cold start). Safe handle via frontend loader. |
| **Database** | **Neon.tech** | Serverless Postgres Free | Provides 3 GiB of storage and shared compute, fully compatible with Postgres 15/16. Ideal for light relational operations. |
| **Push Channel** | **W3C Web Push / VAPID** | Native Browser Specs | Free delivery via Apple Push Notification service (APNs) and Google FCM. Enabled from Settings when the user opts in. |
| **SMS Channel** | **Twilio** (or similar) | Pay-as-you-go / trial credits | Optional. Sends text alerts to the phone number saved in Settings. Only dispatched for users who explicitly enable SMS. |

---

## 2. System Architecture & Core Workflows

The application utilizes an **On-Demand Hydration Strategy** to keep operations efficient, protect free-tier third-party API rate limits, and provide real-time updates for dynamic knockout progression.

### A. Core Architectural Diagram

```
                              +-------------------------+
                              |   Vercel / Netlify      |
                              |  (Vite + TS PWA Client) |
                              +------------+------------+
                                           |
                               HTTP / HTTPS Requests
                                           v
                              +------------+------------+
                              |      Render.com         |
                              |     (NestJS API)        |
                              +---+---------------+-----+
                                  |               |
               TypeORM / Postgres |               | Axion / Outbound HTTP
                                  v               v
                        +---------+----+   +------+------------------+
                        |  Neon.tech   |   |   Sportmonks V3 API    |
                        | (PostgreSQL) |   | (Dynamic World Cup Data)|
                        +--------------+   +-------------------------+
```

### B. Phased Delivery Model

| Phase | Scope | User-facing outcome |
| :--- | :--- | :--- |
| **Phase 1 (MVP)** | **Fixtures Widget only** | Day-wise match schedule; no other tabs, no Settings |
| Phase 2 | Hub Widget | Unified tournament dashboard combining multiple widgets |
| Phase 3 | Livescore Widget | Real-time scores and minute-by-minute events |
| Phase 4 | Bracket Widget | Visual knockout tree, auto-updating |
| Phase 5 | Teams Widget | 48-team squad rosters and player profiles |
| Phase 6 | Live Standings Widget | Live group tables + bracket progression |
| Phase 7 | Settings + Notifications | Team follows, push alerts, SMS opt-in |

Phase 1 intentionally does **one thing well**. Every later phase adds a self-contained widget module registered into the same app shell—no monolithic page rewrites.

### C. Widget Platform Architecture

The SPA is a thin **shell** that lazy-loads independent **widgets**. Each widget owns its UI, data hooks, and loading/error states. The shell provides routing, shared layout, and a widget registry.

```
+------------------------------------------------------------------+
|                        App Shell (Vite + React)                   |
|  +----------+  +------------------------------------------------+ |
|  | Widget   |  |  Active Widget Viewport                        | |
|  | Registry |  |  (only registered widgets render nav tabs)     | |
|  +----------+  +------------------------------------------------+ |
|       |                                                           |
|       +-- fixtures/     (Phase 1 — SHIP FIRST)                   |
|       +-- hub/          (Phase 2 — composes child widgets)       |
|       +-- livescore/    (Phase 3)                                 |
|       +-- bracket/      (Phase 4)                                 |
|       +-- teams/        (Phase 5)                                 |
|       +-- standings/    (Phase 6)                                 |
+------------------------------------------------------------------+
                              |
                    per-widget API modules
                              v
+------------------------------------------------------------------+
|                     NestJS API (modular)                          |
|  /api/fixtures   (Phase 1)                                       |
|  /api/livescore  (Phase 3)   /api/bracket   (Phase 4)            |
|  /api/teams      (Phase 5)   /api/standings (Phase 6)            |
|  /api/user/*     (Phase 7 — notifications)                       |
+------------------------------------------------------------------+
```

**Widget contract (every module implements):**

```typescript
interface TournamentWidget {
  id: string;                    // e.g. 'fixtures'
  label: string;                 // nav tab label
  phase: number;                 // minimum phase to enable
  lazy: () => Promise<Component>; // code-split entry
  navOrder: number;
}
```

Phase 1 registers **only** the `fixtures` widget. Later phases call `registerWidget()` and flip a feature flag—navigation tabs appear automatically.

**Suggested frontend layout:**

```
src/
  shell/           AppShell, Header, WidgetRouter, registry.ts
  widgets/
    fixtures/      Phase 1 — DayWiseFixturesList, MatchCard, useFixtures()
    hub/           Phase 2 — aggregates other widgets in one scroll view
    livescore/     Phase 3
    bracket/       Phase 4
    teams/         Phase 5
    standings/     Phase 6
  features/
    settings/      Phase 7 — notification preferences
```

### D. Future Widget Catalog

Widgets to add after Phase 1. Each is a standalone module the Hub can embed or that gets its own nav tab.

| Widget | What visitors see | Why add it |
| :--- | :--- | :--- |
| **Hub** | Fixtures, group standings, knockout bracket, top scorers, and team profiles in one scrollable view | Full tournament picture without leaving the site |
| **Livescore** | Real-time match scores with minute-by-minute events; mobile-friendly | Live data on-page—no redirect to external score sites |
| **Bracket** | Visual tournament bracket for World Cup 2026; auto-updates as matches finish | Visitors follow knockout progression in-place |
| **Teams** | Full squad overviews for all 48 national teams—player profiles, positions, stats | Rosters to browse before and during the tournament |
| **Live Standings** | Live group tables as matches play; knockout slots update as teams advance | Standings and bracket progression without a separate page |

The **Hub Widget** (Phase 2) is a layout composer—it renders compact versions of other widgets and does not duplicate data logic.

### E. Primary User Journey

**Phase 1 (MVP):**

```
  App Open  -->  Day-wise Fixtures List  (only screen; no Settings)
```

**Full product (Phase 7):**

```
  App Open
      |
      v
+------------------+
|  Hub or Fixtures |  <-- default tab; widget nav grows per phase
+------------------+
      |
      |  user taps Settings (gear icon) — Phase 7 only
      v
+------------------+
|     Settings     |
|  - Name          |
|  - Follow teams  |
|  - Push alerts   |
|  - When to notify|  <-- Phase 7.1; default 5 min before
+------------------+
```

1. **Phase 1:** SPA mounts the Fixtures widget immediately and calls `GET /api/fixtures`. No other nav items, no sign-up, no notification prompts.
2. **Later phases:** New widgets register into the shell; existing Fixtures code is untouched.
3. **Settings (Phase 7):** Notification preferences are opt-in on a separate screen. Unconfigured users still see all tournament content.
4. **Reminder timing (Phase 7.1):** when push is on, user picks how far ahead to be alerted (default 5 min; up to 1 day). Cron fires one push per followed match at that offset.

### F. Setup / Data Hydration Workflow
1. **User Request:** A user loads the frontend. The SPA dispatches a request to `GET /api/fixtures`.
2. **Database Verification:** The backend checks the database state (`SELECT COUNT(*)`).
3. **Dynamic Fetch Condition:** * **If Database is Empty:** The backend intercepts execution, issues an outbound request to the **Sportmonks API**, normalizes the schedule payloads (including TBD structural placeholders for knockouts), upserts them to Postgres, and streams down the dataset.
   * **If Database Contains Rows:** The backend bypasses the third-party provider entirely, sourcing the response natively from Postgres to eliminate API rate limit exhaustion.
4. **Manual Re-Sync Action:** If teams update during late tournament changes and the database needs a hard flush, clearing rows inside the Neon table forces the next user hit to pull the newest bracket states seamlessly.

---

## 3. Database Schema Design (PostgreSQL + TypeORM)

Schema is owned by **TypeORM entities** and applied through **versioned migrations** in `api/src/migrations/`. Both the NestJS runtime and the migration CLI use the same `DATABASE_URL` from `api/.env`. `synchronize` is disabled — never rely on auto-sync in any environment.

**Local / deploy workflow:**

```bash
cd api
npm run migration:run     # apply pending migrations
npm run migration:show    # inspect migration status
```

On Render, migrations run automatically during the build step.

### Phase 1 — `FixtureEntity` (`api/src/fixtures/entities/fixture.entity.ts`)

| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | `INT` PK | Sportmonks fixture ID |
| `match_number` | `INT` nullable | Official FIFA match number (1–104) |
| `match_date_time` | `TIMESTAMPTZ` | Indexed (`idx_fixtures_date`) |
| `stage_id` | `INT` | Group stage vs knockout round |
| `home_team` | `VARCHAR(100)` | Country or bracket placeholder |
| `away_team` | `VARCHAR(100)` | Country or bracket placeholder |
| `venue` | `VARCHAR(150)` | Defaults to `TBD` |
| `updated_at` | `TIMESTAMPTZ` | Auto-maintained |

Initial migration: `1749523200000-CreateFixturesTable.ts`.

### Future phases — planned entities (add via new migrations)

**Users** (Phase 7 + 7.1):

```typescript
// users — id, user_name, push_subscription, push_notifications_enabled,
// reminder_minutes_before (Phase 7.1, default 5), created_at, updated_at
```

**Followed teams** (Phase 7):

```typescript
// followed_teams — composite PK (user_id, team_name), FK → users
// index on team_name for cron notification lookups
```

---

## 4. API Endpoints Signature Matrix

All API inputs/outputs adopt standard REST communication structures using strict JSON contracts. Endpoints are grouped by **widget domain** so each phase adds a module without touching existing routes.

### Phase 1 — Fixtures Widget (MVP)

#### 1. Retrieve Match Records
* **Endpoint:** `GET /api/fixtures`
* **Description:** Returns the global list of fixtures sorted chronologically. Automatically handles seeding if Postgres tables report zero records.
* **Response Payload (`200 OK`):**
```json
[
  {
    "id": 439281,
    "match_number": 1,
    "match_date_time": "2026-06-11T20:00:00.000Z",
    "stage_id": 12049,
    "home_team": "Mexico",
    "away_team": "TBD",
    "venue": "Estadio Azteca"
  }
]
```

### Phase 2–6 — Future Widget APIs (stub; implement when widget ships)

| Widget | Planned endpoints | Sportmonks data consumed |
| :--- | :--- | :--- |
| **Hub** | `GET /api/hub` — aggregated snapshot for dashboard | Composes responses from fixtures, standings, bracket, scorers, teams |
| **Livescore** | `GET /api/livescore`, `GET /api/livescore/:fixtureId` | Live scores, events, minute clock |
| **Bracket** | `GET /api/bracket` | Knockout tree nodes and progression |
| **Teams** | `GET /api/teams`, `GET /api/teams/:id/squad` | 48 national squads, player profiles |
| **Live Standings** | `GET /api/standings/groups`, `GET /api/standings/knockout` | Group tables, qualification slots |

Each endpoint follows the same **on-demand hydration** pattern as fixtures: serve from Postgres when fresh, fetch from Sportmonks and upsert when empty or stale.

### Phase 7 — Settings & Notifications

#### 2. List Teams (Settings Team Picker)
* **Endpoint:** `GET /api/teams/names`
* **Description:** Returns a deduplicated, sorted list of team names extracted from `fixtures` (including bracket placeholders like `Winner Group A`). Powers the multi-select in Settings. *(Distinct from `GET /api/teams` which returns full team profiles in Phase 5.)*
* **Response Payload (`200 OK`):**
```json
["Argentina", "Mexico", "Winner Group A", "TBD"]
```

#### 3. Save User Settings (Notifications Opt-In)
* **Endpoint:** `PUT /api/user/settings`
* **Description:** Called from the Settings screen when the user taps **Save**. Upserts profile and notification preferences. Fields are optional except `userName` and `teams` (teams may be an empty array if the user clears all follows).
* **Request Body Layout:**
```json
{
  "userName": "Akhilesh",
  "teams": ["Mexico", "Argentina"],
  "pushNotificationsEnabled": true,
  "reminderMinutesBefore": 5,
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/f_xyz...",
    "expirationTime": null,
    "keys": {
      "p256dh": "BLm...cryptographic-public-key...",
      "auth": "WjE...authentication-token..."
    }
  }
}
```
* **Notes:**
  * Omit `subscription` (or send `null`) when `pushNotificationsEnabled` is `false`.
  * `reminderMinutesBefore` — preset minutes before kickoff. Allowed values: `5` (default), `15`, `60`, `180`, `1440`. Ignored when push is disabled; server stores default `5`.
  * The client requests browser notification permission only when the user toggles push on.
* **Response Payload (`200 OK`):**
```json
{
  "success": true,
  "message": "Notification preferences saved."
}
```

#### 4. Match Alert Dispatched Query (Automated Task Input)
* **Endpoint:** `POST /api/fixtures/check-reminders`
* **Description:** Executed by an external scheduler (e.g., Cron-Job.org) every **10–15 minutes**. For each user with `push_notifications_enabled = true` and a stored `push_subscription`, finds followed-team fixtures whose kickoff falls inside that user's **personal reminder window**, then dispatches **one Web Push per user per fixture** (deduped via `reminder_dispatches`).
* **Per-user reminder window (Phase 7.1):**
  * Let `M` = `users.reminder_minutes_before` (default `5`).
  * Let `S` = cron slack (12 minutes — covers 10–15 min scheduler interval).
  * A fixture is due for user `U` when:  
    `match_date_time` ∈ `[now + M minutes, now + M + S minutes]`
  * Example: `M = 5` → alert ~5 min before kickoff; `M = 1440` → alert ~1 day before.
* **Cron efficiency:** batch users by distinct `reminder_minutes_before` values; one fixture query per bucket.
* **Response Payload (`200 OK`):**
```json
{
  "success": true,
  "notificationsSent": 42
}
```

---

## 5. Frontend UI/UX Design

The interface follows a **widget-first shell** pattern: Phase 1 ships a single Fixtures widget; navigation and Settings grow as later phases register new modules.

### A. App Shell & Navigation

**Phase 1 (MVP):**

| Route | Purpose | Visible |
| :--- | :--- | :--- |
| `/` | Day-wise fixtures list | Yes — only screen |

No bottom nav, no Settings gear, no extra tabs. Header shows title only: `FIFA World Cup 2026`.

**Full product (Phase 2–7):**

| Route / Tab | Widget | Phase |
| :--- | :--- | :--- |
| `/` or `/hub` | Hub (or Fixtures until Hub ships) | 2 |
| `/fixtures` | Fixtures | 1 |
| `/livescore` | Livescore | 3 |
| `/bracket` | Bracket | 4 |
| `/teams` | Teams | 5 |
| `/standings` | Live Standings | 6 |
| `/settings` | Notification preferences | 7 |

Nav tabs are **generated from the widget registry**—only enabled widgets appear. Settings gear renders only when Phase 7 is active.

### B. Fixtures Widget (Phase 1 — Ship First)

The entire MVP is this widget. Build it as an isolated module under `src/widgets/fixtures/`.

* Loads `GET /api/fixtures` on mount; shows a skeleton loader during cold-start backend spin-up.
* **Day-wise grouping:** matches clustered under localized date headings (e.g., `Thu, 11 Jun 2026`). Users scroll chronologically through the tournament.
* **Match card:** match number, kickoff time (local timezone), stage badge, home vs away, venue.
* **Empty state:** if the API returns zero rows, show a **Refresh** button that re-fetches (triggers Sportmonks hydration on the backend).
* **No extras in Phase 1:** no team highlights, no filters, no Settings link, no notification prompts.

**Phase 7 additions** (same widget, incremental):
* Followed-team highlight on cards when user has saved teams in Settings (`localStorage`).

### C. Settings Screen (Phase 7 — Opt-In Notifications)

Four clearly separated sections, top to bottom:

**1. Profile**
* **Name** — text input (`userName`), required to save.

**2. Teams You Follow**
* Multi-select checklist populated from `GET /api/teams/names`.
* Search/filter for long knockout lists.
* Helper text: *"You'll be notified before these teams kick off."*
* Applies to **both** push and SMS channels.

**3. Push Notifications**
* Toggle: **Enable push alerts on this device**
* On enable: request `Notification.requestPermission()`, register service worker, capture VAPID subscription, include in save payload.
* On disable: clear `push_subscription` on save; hide timing control.

**3b. When to Notify** *(Phase 7.1 — shown only when push is enabled)*
* Single-select preset list (not free-form — avoids cron edge cases and confusing UX).
* **Default:** `5 minutes before kickoff`
* Options: `5 min` · `15 min` · `1 hour` · `3 hours` · `1 day before`
* Helper text: *"You'll get one alert per followed match at this time."*
* Maps to `reminderMinutesBefore` in save payload and `localStorage`.

**Save button** (sticky footer): validates name, calls `PUT /api/user/settings`, shows toast on success. Preferences mirrored to `localStorage` so followed-team highlights work offline on the Fixtures screen.

### D. UX Principles

* **Ship small:** Phase 1 is day-wise fixtures only—nothing else in the UI.
* **Plug, don't rewrite:** each new widget is a new folder + registry entry; Fixtures code stays stable.
* **Zero gate:** first paint is always tournament content (fixtures in Phase 1; Hub or fixtures in later phases).
* **Progressive disclosure:** notification controls appear only in Settings (Phase 7).
* **User-controlled timing:** default last-minute alert (5 min); optional earlier heads-up up to 1 day before (Phase 7.1).
* **One alert per match:** regardless of lead time, each user receives at most one push per fixture they follow.
* **Mobile-first widgets:** Livescore, Bracket, and Standings are designed for thumb-friendly layouts from the start.

---

## 6. PWA Implementation Architecture

Push alerts use native browser service worker capabilities; SMS is handled server-side via Twilio when enabled in Settings.

### A. VAPID Key Infrastructure
Generate structural verification coordinates to safely validate handshake patterns between servers and web browser hubs:
```bash
npx web-push generate-vapid-keys
```
Place them in the NestJS config space (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`).

### B. Client Service Worker (`public/sw.js`)
This persistent script processes inbound browser event messages in background states.

```javascript
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'Match Alert!', body: 'A tournament game kicks off soon!' };

  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
```

### C. Web Manifest Entry Requirements (`public/manifest.json`)
Essential for PWA compliance, specifically to enable notification support on modern iOS devices.

```json
{
  "short_name": "WC2026",
  "name": "FIFA World Cup 2026 Fixtures",
  "icons": [
    {
      "src": "icon-192x192.png",
      "type": "image/png",
      "sizes": "192x192"
    },
    {
      "src": "icon-512x512.png",
      "type": "image/png",
      "sizes": "512x512"
    }
  ],
  "start_url": "/",
  "background_color": "#ffffff",
  "theme_color": "#0070f3",
  "display": "standalone",
  "orientation": "portrait"
}
```

---

## 7. Project Execution Plan & Milestones

> **Progress:** track completion in the [Implementation Status Tracker](#implementation-status-tracker) at the top of this document.

### Phase 1 — MVP: Day-Wise Fixtures (ship this first)

1. **1a. DB + API skeleton** — Spin up **Neon.tech**, run TypeORM migrations (`npm run migration:run`), configure NestJS + TypeORM. Implement Sportmonks hydration for `GET /api/fixtures` only.
2. **1b. Widget shell** — Scaffold Vite + React app with `shell/` (layout, widget registry) and `widgets/fixtures/` (day-grouped list, match cards, Refresh empty state). Register only the Fixtures widget—no nav tabs.
3. **1c. Deploy** — Push frontend to Vercel/Netlify, API to Render. Verify end-to-end: open app → see day-wise schedule.

### Phase 2 — Hub Widget

Build `widgets/hub/` as a composer that embeds compact Fixtures + Standings + Bracket + Scorers + Teams previews. Add `GET /api/hub` aggregated endpoint. Enable Hub tab in widget registry.

### Phase 3 — Livescore Widget

Add livescore tables + `GET /api/livescore` endpoints with Sportmonks live polling or webhook sync. Build `widgets/livescore/` with real-time score cards and event timeline. Mobile-optimized layout.

### Phase 4 — Bracket Widget

Add bracket schema + `GET /api/bracket`. Build `widgets/bracket/` with visual knockout tree; auto-refresh on match completion.

### Phase 5 — Teams Widget

Add teams/players tables + `GET /api/teams`, `GET /api/teams/:id/squad`. Build `widgets/teams/` with 48-team roster browser and player profiles.

### Phase 6 — Live Standings Widget

Add standings tables + `GET /api/standings/groups`. Build `widgets/standings/` with live group tables and knockout qualification indicators.

### Phase 7 — Settings & Notifications

Apply `users` + `followed_teams` schema. Implement `PUT /api/user/settings`, VAPID push (Web Push only — no SMS). Add `features/settings/` screen and Settings gear to shell. Add followed-team highlights to Fixtures widget. Configure **Cron-Job.org** on `/api/fixtures/check-reminders` every 10–15 minutes.

### Phase 7.1 — Reminder Timing Preference

Add `users.reminder_minutes_before` (default `5`). Extend Settings with a **When to notify** preset picker. Update `ReminderService` to evaluate per-user windows (`match_date_time` ∈ `[now + M, now + M + slack]`). Ship unit tests for all five presets. **Shipped** — replaces the earlier fixed ~10 min offset.