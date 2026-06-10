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
# Set DATABASE_URL and SPORTMONKS_API_KEY
npm install
npm run migration:run:local
npm run start:dev
```

API runs at `http://localhost:3000`.

**Manual re-sync:** call `GET /api/fixtures?refresh=true`, or clear the `fixtures` table and reload the app.

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

- `GET /api/fixtures` with on-demand Sportmonks hydration
- Widget shell with only the Fixtures widget registered
- Day-wise grouped match cards, skeleton loader, empty state + refresh

## Phase 7 — Settings & Notifications

After applying migrations, configure push in `api/.env`:

```bash
# Generate keys (do not commit the private key)
npx web-push generate-vapid-keys
```

Add to `api/.env`:

- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (e.g. `mailto:you@example.com`)
- `CRON_SECRET` — random string for `POST /api/fixtures/check-reminders`

**Cron-Job.org (post-deploy):** schedule `POST https://<your-api>/api/fixtures/check-reminders` every 10–15 minutes with header `X-Cron-Secret: <CRON_SECRET>`.

**Web app:** open `/settings`, follow teams, enable push, choose **when to notify** (default **5 minutes before** kickoff; options up to **1 day before**), and save. Followed teams are highlighted on fixture cards.

SMS is intentionally omitted (zero-cost Web Push only, per product architect).

**Migration for Phase 7.1:** after Phase 7 migrations, run `npm run migration:run:local` again to add `users.reminder_minutes_before`.
