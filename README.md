# FIFA World Cup 2026 — Fixtures PWA

Phase 1 ships day-grouped fixtures. Phase 7 adds notification settings (team follows + Web Push alerts) on the same widget shell.

## Project layout

```
api/     NestJS + TypeORM backend (Render-ready)
web/     Vite + React widget shell (Vercel/Netlify-ready)
```

## Node version

Requires **Node 22.13.1** (see `.nvmrc` / `.npmrc`). With nvm:

```bash
nvm use
```

`engine-strict=true` in `.npmrc` will fail installs on unsupported Node versions.

## Quick start (local)

### 1. Database

1. Create a free [Neon](https://neon.tech) Postgres database.
2. Set `DATABASE_URL` in `api/.env` (see `.env.example`).
3. Apply TypeORM migrations:

```bash
cd api
npm run migration:run:local
```

Schema is defined by TypeORM entities under `api/src/**/entities/` and versioned in `api/src/migrations/`. New tables ship as migrations — do not edit the database by hand.

### 2. API

```bash
cd api
cp .env.example .env
# Set DATABASE_URL (no third-party API key required for fixtures)
npm install
npm run migration:run:local
npm run start:dev
```

API runs at `http://localhost:3000`.

**Manual re-sync:** call `GET /api/fixtures?refresh=true` to pull the latest schedule and final scores from ESPN. To test a full fresh lifecycle, drop/reset the database, run migrations, then open the app (first load hydrates `teams` + `fixtures` automatically).

**Schema note:** `teams` and `venues` are normalized lookup tables; fixtures reference `home_team_id`, `away_team_id`, and `venue_id`; followed-team preferences reference `teams.id`.

**Optional env:** `ESPN_WC_DATE_RANGE` (default `20260611-20260719`) overrides the ESPN scoreboard date filter.

### 3. Web

```bash
cd web
cp .env.example .env
npm install
npm run dev
```

App runs at `http://localhost:5173` (Vite picks the next free port if 5173 is taken).

Local dev uses a Vite proxy: the web app calls `/api/fixtures` on the same origin and Vite forwards to `http://localhost:3000`. Leave `VITE_API_BASE_URL` unset in `web/.env` for this setup. Set it only for production builds pointing at a remote API.

## Database migrations

All schema changes are managed through TypeORM. The CLI and runtime both read `DATABASE_URL` from `api/.env`.

```bash
cd api
npm run migration:show    # list pending/applied migrations
npm run migration:run:local     # apply pending migrations
npm run migration:revert  # roll back the last migration
```

On Render, migrations run automatically during the build step (`render.yaml`).

To add a new table in a later phase: create a TypeORM entity, generate or author a migration in `api/src/migrations/`, and run `npm run migration:run:local`.

## Tests

```bash
cd api && npm test
cd ../web && npm test
```

## Deploy

- **Backend:** connect the `api/` folder to Render (Root Directory: `api`). `@nestjs/cli` and `typescript` are production dependencies so `npm install && npm run build` works on Render. Migrations use `migration:run` (reads `DATABASE_URL` from Render env vars).
- **Frontend:** deploy `web/` to Vercel or Netlify with `VITE_API_BASE_URL` pointing at the Render API URL.

## Phase 1 scope

- `GET /api/fixtures` with on-demand ESPN hydration (schedule + final scores)
- Widget shell with only the Fixtures widget registered
- Day-wise grouped match cards with finished-match scores, skeleton loader, sticky header refresh + empty-state refresh

## Phase 7 — Settings & Notifications

After applying migrations, configure push in `api/.env`:

```bash
# Generate keys (do not commit the private key)
npx web-push generate-vapid-keys
```

Add to `api/.env`:

- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (e.g. `mailto:you@example.com`)
- `CRON_SECRET` — random string for `POST /api/notifications/check-reminders`

**Cron-Job.org (post-deploy):** schedule `POST https://<your-api>/api/notifications/check-reminders` every 10–15 minutes with header `X-Cron-Secret: <CRON_SECRET>`.

**Web app:** open `/settings`, follow teams, enable push, choose **when to notify** (default **5 minutes before** kickoff; options up to **1 day before**), and save. Followed teams are highlighted on fixture cards.

SMS is intentionally omitted (zero-cost Web Push only, per product architect).

**Migration for Phase 7.1:** after Phase 7 migrations, run `npm run migration:run:local` again to add `users.reminder_minutes_before`.

## Production safeguards (implemented Jun 2026)

### Sprint 1 — Hardening

| Area | What was done |
| :--- | :--- |
| **Input validation** | `ValidationPipe` (`whitelist`, `transform`, `forbidNonWhitelisted`) is registered globally in `main.ts`. All `PUT /api/user/settings` fields are validated with `class-validator` decorators — malformed payloads return `400` before reaching the service layer. |
| **Rate limiting** | `@nestjs/throttler` is installed. A global guard enforces 30 requests/min per IP. The `GET /api/fixtures` endpoint has a stricter override of 20 requests/min to protect the ESPN sync path from hammering. |
| **Sync race condition** | `FixturesService` and `StandingsService` use an in-flight promise guard (`syncPromise`). Concurrent cold-start requests share one ESPN fetch instead of triggering duplicate syncs. |
| **DB integrity** | `reminder_dispatches.fixture_id` now has a `FOREIGN KEY … REFERENCES fixtures(id) ON DELETE CASCADE` constraint (migration `1749530200000`). `GroupStandingEntity` `ManyToOne` decorators carry `onDelete: 'CASCADE'` to match the existing migration FK constraints. |
| **Cron efficiency** | `ReminderService.checkAndDispatchReminders()` uses 3 bulk queries per reminder-bucket instead of 2 queries per fixture (eliminates N+1 pattern against Neon free tier). |
| **Atomic push dispatch** | The `reminder_dispatches` dedup record is inserted (`ON CONFLICT DO NOTHING RETURNING`) **before** the Web Push fires. If the push fails the record is deleted so the next cycle can retry. Concurrent cron runs are blocked by the `RETURNING` row-count check. |
| **Notifications route** | Cron endpoint moved from `POST /api/fixtures/check-reminders` to `POST /api/notifications/check-reminders`. Update your Cron-Job.org job URL if already configured. |

### Sprint 2 — Security & Code Quality

| Area | What was done |
| :--- | :--- |
| **HTTP security headers** | `helmet()` is applied in `main.ts` before all other middleware. CSP is set to `default-src 'none'; frame-ancestors 'none'` — appropriate for a JSON API. Adds `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, and others automatically. |
| **Global exception filter** | `AllExceptionsFilter` is registered globally. Unhandled TypeORM or runtime errors log their full stack trace internally and return only `{ statusCode, message }` to the client — no internal paths or trace details ever reach the wire. |
| **Expired push subscriptions** | `sendPush()` now catches `WebPushError` with status 410/404 and re-throws as `ExpiredSubscriptionError`. `ReminderService` catches it and clears `push_subscription` and disables push for that user, so dead endpoints do not accumulate and waste future cron cycles. |
| **Cron auth guard** | `CronSecretGuard` (`api/src/common/guards/`) implements `CanActivate`. `NotificationsController` uses `@UseGuards(CronSecretGuard)` — the auth logic is reusable and no longer inlined in the controller method. |
| **Env validation at startup** | `ConfigModule.forRoot()` now includes a Joi `validationSchema`. `DATABASE_URL` is required — the app refuses to boot with a descriptive error if it is absent. All other vars (`NODE_ENV`, `PORT`, `CORS_ORIGIN`, `DATABASE_SSL`) have typed defaults. |
| **SSL configuration** | `DATABASE_SSL=true/false` env var is now the authoritative SSL switch. Set it in Render env vars. The old `neon.tech` hostname heuristic remains as a backward-compatible fallback for existing deployments. |
| **Health endpoint** | `GET /api/health` returns `{ status: "ok", timestamp }` with no auth. Configure this as the **Render health check URL** so Render can confirm the process is fully up after a cold start before routing traffic. |
| **SettingsPage refactor** | `SettingsPage.tsx` decomposed from 236 lines into `hooks/useTeamOptions.ts` (data fetching), `hooks/useSettingsForm.ts` (form state + submit), `TeamSelectorSection.tsx`, and `PushNotificationsSection.tsx` (pure render components). The page shell is now ~75 lines. |
