# FIFA World Cup 2026 — Fixtures PWA

Zero-budget Progressive Web App for the FIFA World Cup 2026 — day-grouped fixtures, hub dashboard, standings, bracket, team squads, and Web Push kickoff reminders. No paid APIs: fixtures, scores, standings, and rosters hydrate on-demand from ESPN's public JSON.

**Stack:** NestJS + TypeORM + Neon Postgres (API) · Vite + React (web) · Render (API host) · Vercel/Netlify (web host)

---

## Project layout

```
api/    NestJS backend (Render-ready)
web/    Vite + React PWA shell (Vercel/Netlify-ready)
```

## Requirements

Node **22.13.1** (`engine-strict=true` enforced via `.npmrc`). Run `nvm use` if using nvm.

---

## Quick start

### 1. Database

Create a free [Neon](https://neon.tech) Postgres database, set `DATABASE_URL` in `api/.env`, then apply migrations:

```bash
cd api && npm run migration:run:local
```

### 2. API

```bash
cd api
cp .env.example .env   # set DATABASE_URL at minimum
npm install
npm run migration:run:local
npm run start:dev       # http://localhost:3000
```

Fixtures are hydrated on first request. Call `GET /api/fixtures?refresh=true` to re-sync scores from ESPN at any time. Teams (`GET /api/teams`) and per-nation squads (`GET /api/teams/:id/squad`) follow the same on-demand pattern — see [`docs/espn_api_signatures.md`](docs/espn_api_signatures.md).

### 3. Web

```bash
cd web
cp .env.example .env
npm install
npm run dev             # http://localhost:5173
```

Vite proxies `/api/*` to `localhost:3000` in dev — leave `VITE_API_BASE_URL` unset locally.

---

## Migrations

```bash
cd api
npm run migration:show         # list pending / applied
npm run migration:run:local    # apply pending
npm run migration:revert       # roll back last
```

On Render, migrations run automatically during the build step (`render.yaml`).

---

## Tests

```bash
cd api && npm test
cd web && npm test
```

---

## Deploy

| Layer | Where | Notes |
| :--- | :--- | :--- |
| API | Render (Root Dir: `api`) | Set `DATABASE_URL`, `VAPID_*` env vars. Health check: `GET /api/health`. |
| Web | Vercel / Netlify | Set `VITE_API_BASE_URL` to your Render API URL. |

---

## Push notifications (Phase 7)

Generate VAPID keys and add to `api/.env`:

```bash
npx web-push generate-vapid-keys
```

Required env vars: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.

Users configure notification timing (5 min → 1 day before kickoff) and followed teams from the `/settings` page.

---

## Widgets (shipped)

| Tab | Route | API |
| :--- | :--- | :--- |
| Hub | `/` | `GET /api/hub` |
| Fixtures | `/fixtures` | `GET /api/fixtures` |
| Standings | `/standings` | `GET /api/standings/groups` |
| Teams | `/teams` | `GET /api/teams`, `GET /api/teams/:id/squad` |
| Bracket | `/bracket` | `GET /api/bracket` |
| Settings | `/settings` | `PUT /api/user/settings` |

Implementation status and phase checklist: [`docs/fifa_2026_complete_blueprint.md`](docs/fifa_2026_complete_blueprint.md).

---

## Architecture

```mermaid
flowchart TD
    subgraph Client["Browser / PWA (Vercel)"]
        UI["React App\n(Vite)"]
        SW["Service Worker\n(Web Push)"]
    end

    subgraph API["NestJS API (Render)"]
        FC["FixturesController"]
        FS["FixturesSyncService"]
        NS["NotificationService\n(ReminderService)"]
        HE["GET /api/health"]
    end

    subgraph DB["Neon Postgres"]
        T["teams"]
        P["players / team_squad_members"]
        V["venues"]
        FX["fixtures"]
        U["users"]
        RD["reminder_dispatches"]
    end

    ESPN["ESPN Public JSON\n(scoreboard, standings, teams/roster)"]

    UI -- "GET /api/fixtures" --> FC
    FC -- "DB empty or ?refresh=true" --> FS
    FS -- "fetch scoreboard" --> ESPN
    ESPN -- "fixtures + scores" --> FS
    FS -- "upsert" --> T & V & FX
    FX -- "serve" --> FC --> UI

    UI -- "PUT /api/user/settings\n(follow teams, push prefs)" --> U
    UI -- "POST /api/notifications/subscribe" --> NS
    NS -- "store subscription" --> U
    NS -- "query upcoming fixtures\n+ followed teams" --> FX & U
    NS -- "dedup insert" --> RD
    NS -- "VAPID push" --> SW
    SW -- "native alert" --> UI
```

---

## Key design decisions

- **On-demand hydration:** ESPN is called only when the DB is empty or `?refresh=true` is passed — always user-triggered (fixtures, standings, teams list, per-team squads).
- **Normalized schema:** `teams`, `venues`, `players`, and `team_squad_members` are lookup tables; fixtures and followed-team preferences reference team IDs.
- **One push per match:** `reminder_dispatches` deduplicates on `(user_id, fixture_id)` so no duplicate alerts.
- **Zero-cost infra:** Web Push (VAPID) only — no SMS, no paid notification gateway.
