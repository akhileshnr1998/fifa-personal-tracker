# Phase 2 — Hub Widget Implementation Plan

> **Status:** Code complete (as of 2026-06-30) — deploy + manual E2E sign-off pending  
> **Shipped scope:** Top scorers + teams quick-links only (no embedded Fixtures/Standings/Bracket previews)  
> **Related:** [`fifa_2026_complete_blueprint.md`](./fifa_2026_complete_blueprint.md) · [`product_architect_agent.md`](./product_architect_agent.md) · [`espn_api_signatures.md`](./espn_api_signatures.md)

---

## Executive summary

Phase 2 adds a **Hub Widget** — the default landing tab with tournament **top scorers** and **team quick-links**. Fixtures, Standings, and Bracket remain on their dedicated tabs.

**Shipped:** `GET /api/hub`, `web/src/widgets/hub/`, `HubModule` in `AppModule`, Hub registered at `navOrder: 0` (landing page `/`; Fixtures at `/fixtures`).

| Area | Status |
|------|--------|
| `GET /api/hub` + `TopScorersService` | ✅ Shipped |
| Summary backfill for accurate scorers | ✅ `MatchSummaryService.backfillFinishedSummaries()` on hub load |
| Teams quick-links | ✅ Live via `TeamsService.getPickerOptions()`; links to `/teams?team={id}` (Phase 5) |
| Hub widget + registry | ✅ Shipped |
| Embedded Fixtures/Standings/Bracket previews | ⏭️ Deferred — product decision; use dedicated widget tabs |

---

## Blueprint checklist

From the [Implementation Status Tracker](./fifa_2026_complete_blueprint.md#phase-2--hub-widget) in the main blueprint:

- [x] `GET /api/hub` aggregated endpoint
- [x] `src/widgets/hub/` — Hub widget
- [x] Top scorers section (live via `match_events` + summary backfill)
- [x] Teams quick-links section — live names grid; each chip links to Teams widget squad (`/teams?team={id}`)
- [x] Hub tab enabled in widget registry (default landing)
- [ ] Compact Fixtures / Standings / Bracket previews *(deferred — not in shipped scope)*
- [ ] **Phase 2 signed off**

---

## What's already built *(context at planning time)*

### Backend modules used by Hub

| Module | Endpoint | Hub use |
|--------|----------|---------|
| `MatchSummaryModule` | `GET /api/fixtures/:id/summary` | Backfills `match_events` for finished fixtures on hub load |
| `TeamsModule` | `GET /api/teams/names` | Team quick-link grid (links to Phase 5 `GET /api/teams/:id/squad` via `/teams?team={id}`) |
| `FixturesModule` | `GET /api/fixtures` | Optional `?refresh=true` sync before hub read |

`AppModule` registers `HubModule` alongside Fixtures, Bracket, Standings, MatchSummary, Teams, Users, and Notifications.

### Frontend

```
web/src/widgets/hub/
  HubWidget.tsx          Top scorers + teams sections
  useHub.ts              Cache/retry; GET /api/hub
  sections/
    TopScorersSection.tsx
    TeamsQuickLinksSection.tsx
```

Widget registry (`web/src/shell/register-widgets.ts`):

| Widget | Phase | navOrder | Route |
|--------|-------|----------|-------|
| Hub | 2 | 0 | `/` (default) |
| Fixtures | 1 | 1 | `/fixtures` |
| Standings | 6 | 2 | `/standings` |
| Teams | 5 | 3 | `/teams` |
| Bracket | 6 | 4 | `/bracket` |

### Top scorers data source

Per [`espn_api_signatures.md`](./espn_api_signatures.md):

> Hub scorers (Phase 2) — Derived from `match_events` table (Phase 8)

`match_events` stores `goal`, `penalty_goal`, `own_goal` with `player_name`, `team_id`, and `minute`. Top scorers aggregate `goal` + `penalty_goal` (own goals excluded).

**Backfill:** On every `GET /api/hub`, `MatchSummaryService.backfillFinishedSummaries()` fetches ESPN summaries for finished fixtures missing goal events (batched, single-flight). Without this, scorers were incomplete because summaries were previously lazy-loaded only from the match drawer.

---

## Shipped implementation

### Backend: `GET /api/hub`

```
api/src/hub/
  hub.module.ts
  hub.controller.ts
  hub.service.ts
  hub.service.spec.ts
  top-scorers.service.ts
  dto/hub-response.dto.ts
```

#### `HubService` responsibilities

| Section | Source | Behaviour |
|---------|--------|-----------|
| `top_scorers` | `TopScorersService` | Aggregate `match_events` goal types; top 10 |
| `teams_quick_links` | `TeamsService.getPickerOptions()` | All followable nations sorted by name |

Before aggregating scorers, hub calls `MatchSummaryService.backfillFinishedSummaries()`.

#### Refresh contract

- `GET /api/hub` — backfill missing summaries, then serve from Postgres.
- `GET /api/hub?refresh=true` — `FixturesService.getFixtures(true)` then backfill + read.
- Throttle: **20 req/min**.

#### Response shape *(shipped)*

```json
{
  "top_scorers": {
    "available": true,
    "entries": [
      {
        "rank": 1,
        "player_name": "Lionel Messi",
        "team": { "id": 202, "name": "Argentina" },
        "goals": 6
      }
    ]
  },
  "teams_quick_links": [
    { "id": 202, "name": "Argentina" }
  ]
}
```

#### `TopScorersService` aggregation rules

- Count events where `type IN ('goal', 'penalty_goal')`.
- Exclude `own_goal` from scorer totals (or count against opposing team — document choice in service).
- Group by `(player_name, team_id)`; tie-break alphabetically by `player_name`.
- Return top 10.

### Frontend: `web/src/widgets/hub/` *(shipped)*

Hub is a lightweight scroll view — **not** a composer of other widget previews.

- `useHub` + `api.ts` — cache/retry pattern
- `HubSkeleton` — cold-start UX
- `TopScorersSection`, `TeamsQuickLinksSection` — team chips are `<Link to="/teams?team={id}">`
- Header **Refresh** → `GET /api/hub?refresh=true` when Hub is mounted

---

## Architecture diagram *(shipped)*

```
┌─────────────────────────────────────────────────────────────┐
│  HubWidget                                                   │
│  ┌─────────────────┐  ┌──────────────────────┐              │
│  │ TopScorersSection│  │ TeamsQuickLinksSection│            │
│  └────────┬─────────┘  └──────────┬───────────┘            │
│           └────────────┬───────────┘                         │
│                   useHub()                                   │
│                        │                                     │
│             GET /api/hub[?refresh=true]                      │
└────────────────────────┼────────────────────────────────────┘
                         v
┌─────────────────────────────────────────────────────────────┐
│  HubService                                                  │
│    ├── MatchSummaryService.backfillFinishedSummaries()       │
│    ├── TopScorersService → match_events                      │
│    └── TeamsService.getPickerOptions()                       │
└─────────────────────────────────────────────────────────────┘
```

---

## $0 stack constraints

From [`product_architect_agent.md`](./product_architect_agent.md):

1. **Summary backfill on hub load** — one batched ESPN pass for missing finished-match summaries; subsequent hub loads are Postgres-only.
2. **Small payloads** — hub returns scorers + team names only.
3. **Cold-start UX** — `HubSkeleton` on first paint; first summary backfill may take 30–45s once.
4. **No cron** — hub updates on user visit/refresh only.

---

## Open decisions *(resolved)*

| # | Decision | Resolution |
|---|----------|------------|
| 1 | Hub content scope | **Top scorers + teams only** — no embedded widget previews |
| 2 | Scorer data completeness | **Summary backfill on hub load** — not lazy drawer-only |
| 3 | Own goals in scorer totals | **Excluded** from player count |
| 4 | `VITE_APP_PHASE` gating | Keep `7` in dev (all tabs visible) |

---

## Test plan

### Backend

- `TopScorersService`: empty table, single player, tie on goals, own goals excluded.
- `HubService`: calls `backfillFinishedSummaries()`; `?refresh=true` triggers fixtures sync.
- `MatchSummaryService.backfillFinishedSummaries`: batch-fetches missing finished-match summaries.
- Throttle: hub endpoint respects 20 req/min.

### Frontend

- Hub skeleton on cold start.
- Header **Refresh** triggers `useHub` refresh when Hub is mounted.
- Followed teams highlighted in teams grid.
- Top scorers empty-state copy when no goal events yet.

### Manual E2E *(sign-off pending)*

1. Open Hub (default `/`) → scorers populate after first backfill.
2. Header Refresh → scorers update for newly finished matches.
3. Teams grid shows followable nations; followed teams highlighted; tap opens Teams widget squad.
4. Fixtures / Standings / Bracket tabs unchanged and reachable from nav.

---

## Blueprint updates *(done 2026-06-30)*

Updated [`fifa_2026_complete_blueprint.md`](./fifa_2026_complete_blueprint.md):

- Phase overview: Phase 2 → `[x]` Code complete
- Phase 2 checklist reflects shipped scope (scorers + teams)
- Hub API table marked ✅ shipped
- Phase 5 Teams widget marked `[x]` Code complete; Hub quick-links link to `/teams?team={id}`

---

## References

| Document | Relevance |
|----------|-----------|
| [`fifa_2026_complete_blueprint.md`](./fifa_2026_complete_blueprint.md) | Phase 2 scope, widget platform contract |
| [`product_architect_agent.md`](./product_architect_agent.md) | Hydration pattern, UX guardrails, SOLID |
| [`espn_api_signatures.md`](./espn_api_signatures.md) | Hub scorers derivation from `match_events`; Teams/roster endpoints (§7) |
| `web/src/shell/registry.ts` | `TournamentWidget` contract |
| `api/src/match-summary/entities/match-event.entity.ts` | Top scorers source table |
