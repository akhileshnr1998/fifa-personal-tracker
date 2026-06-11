# ESPN Public API — Request Signatures for FIFA 2026 App

> **Sources:**
> - [Public ESPN API (community docs)](https://github.com/pseudo-r/Public-ESPN-API)
> - [ESPN hidden API gist](https://gist.github.com/akeaswaran/b48b02f1c94f873c6655e7129910fc3b)
> - Mapped to requirements in [`fifa_2026_complete_blueprint.md`](./fifa_2026_complete_blueprint.md)
>
> **Last updated:** 2026-06-11

---

## 1. Scope & Hydration Policy

This app uses **On-Demand Hydration**: Postgres is the source of truth at runtime; ESPN is called only when the database is empty or the user explicitly refreshes.

| Trigger | Our API | ESPN call |
| :--- | :--- | :--- |
| First load (empty DB) | `GET /api/fixtures` | Yes — full tournament sync |
| Normal load | `GET /api/fixtures` | No — serve from Postgres |
| User taps **Refresh** (header 🔄 or empty-state CTA) | `GET /api/fixtures?refresh=true` | Yes — re-fetch and upsert |
| Push reminders | `POST /api/fixtures/check-reminders` | No — reads local fixtures only |

**Data scope:** No live minute-by-minute polling. Final scores and fixture updates are pulled on **manual refresh only** — not via cron.

**Environment variables** (`api/.env`):

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `ESPN_WC_DATE_RANGE` | `20260611-20260719` | Optional override for scoreboard date filter |

No API key is required.

---

## 2. Primary Endpoint — Full Tournament Sync

**Used by:** `FixturesSyncService.syncFromEspn()` on empty DB or `?refresh=true`.

```http
GET https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard
  ?dates=20260611-20260719
  &limit=200
```

| Query param | Required | Description |
| :--- | :--- | :--- |
| `dates` | Yes | Single day `YYYYMMDD` or range `YYYYMMDD-YYYYMMDD` |
| `limit` | Recommended | Use `200` to receive all 104 matches in one response |

**League slug:** `fifa.world` (FIFA World Cup)

---

## 3. Response → `FixtureEntity` Mapping

Implemented in `api/src/fixtures/fixtures-sync.service.ts`.

| ESPN field | Maps to DB |
| :--- | :--- |
| `event.id` | `fixtures.id` (ESPN event ID, e.g. `760415`) |
| chronological sort index | `fixtures.match_number` (1–104) |
| `event.date` / `competition.startDate` | `fixtures.match_date_time` |
| `event.season.slug` | `fixtures.stage_id` (see stage table below) |
| `competitor.team.id` + `displayName` | `teams` row upserted first; `fixtures.home_team_id` / `away_team_id` FK |
| `competition.venue.id` + `fullName` + `address` | `venues` row upserted first; `fixtures.venue_id` FK |
| `competition.status.type` | `status` |
| `competitor.score` (when finished) | `home_score` / `away_score` |

### 3.1 Stage slug → `stage_id`

| `season.slug` | `stage_id` | UI label |
| :--- | :--- | :--- |
| `group-stage` | 1 | Group Stage |
| `round-of-32` | 2 | Round of 32 |
| `round-of-16` | 3 | Round of 16 |
| `quarterfinals` | 4 | Quarter-final |
| `semifinals` | 5 | Semi-final |
| `3rd-place-match` | 6 | 3rd Place |
| `final` | 7 | Final |

### 3.2 Status mapping

| ESPN `status.type` | App `status` | Show score? |
| :--- | :--- | :--- |
| `completed: true` or `state: post` | `finished` | Yes |
| `STATUS_SCHEDULED`, `state: pre` | `scheduled` | No |
| `POSTPONED`, `CANCELLED`, `ABANDONED` | `postponed` | No |
| `state: in` (live) | `scheduled` | No — no live UI |

Scores are written only when `status === 'finished'`.

### 3.3 Knockout placeholders

ESPN uses descriptive labels instead of bracket codes:

| ESPN example | Followable team? |
| :--- | :--- |
| `Mexico` | Yes |
| `Group E Winner` | No |
| `Third Place Group A/B/C/D/F` | No |
| `Semifinal 1 Winner` | No |
| `Round of 16 8 Winner` | No |

Filtered by `isPlaceholderTeam()` in `api/src/teams/is-placeholder-team.ts`.

---

## 4. Our API Response

```json
{
  "id": 760415,
  "match_number": 1,
  "match_date_time": "2026-06-11T19:00:00.000Z",
  "stage_id": 1,
  "home_team": { "id": 203, "name": "Mexico" },
  "away_team": { "id": 467, "name": "South Africa" },
  "venue": { "id": 1672, "name": "Estadio Banorte" },
  "status": "finished",
  "home_score": 2,
  "away_score": 1
}
```

Scheduled match:

```json
{
  "status": "scheduled",
  "home_score": null,
  "away_score": null
}
```

---

## 5. Future Phases — Additional ESPN Endpoints

These are **not implemented yet** but available on the same public API for later widgets:

| Widget | ESPN endpoint | Notes |
| :--- | :--- | :--- |
| Standings (Phase 6) | `/sports/soccer/fifa.world/standings` | May need `apis/v2` variant |
| Teams (Phase 5) | `/sports/soccer/fifa.world/teams` | Rosters via `/teams/{id}/roster` |
| Hub scorers (Phase 2) | Derive from finished fixtures or ESPN news | TBD |

All future widgets should follow the same on-demand refresh pattern.

---

## 6. Implementation Notes

1. **Three-step sync** — `FixturesSyncService.syncFromEspn()` upserts `teams`, then `venues`, then `fixtures` with `home_team_id` / `away_team_id` / `venue_id` FKs.
2. **No seed migration** — `1749523300000-SeedWorldCup2026Fixtures` is a no-op; data hydrates on first API request.
3. **Rate limits** — One HTTP call per refresh; be respectful (no polling).
4. **Unofficial API** — ESPN may change response shape without notice; keep mapper unit tests with fixture JSON snapshots.
5. **Fresh database test** — drop all tables or reset Neon branch, run `npm run migration:run:local`, open app → first load hydrates from ESPN.

---

## 7. Documentation Index

| Topic | URL |
| :--- | :--- |
| Public ESPN API (soccer) | https://github.com/pseudo-r/Public-ESPN-API/blob/main/docs/sports/soccer.md |
| ESPN hidden API gist | https://gist.github.com/akeaswaran/b48b02f1c94f873c6655e7129910fc3b |
