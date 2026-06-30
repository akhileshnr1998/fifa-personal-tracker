# Phase 2 — Hub Widget Implementation Plan

> **Status:** Code complete (as of 2026-06-30) — manual E2E sign-off pending  
> **Related:** [`fifa_2026_complete_blueprint.md`](./fifa_2026_complete_blueprint.md) · [`product_architect_agent.md`](./product_architect_agent.md) · [`espn_api_signatures.md`](./espn_api_signatures.md)

---

## Executive summary

Phase 2 adds a **Hub Widget** — a single scrollable tournament dashboard that composes compact previews of Fixtures, Standings, Bracket, Top Scorers, and Teams quick-links.

**Phase 2 itself is implemented:** `GET /api/hub`, `web/src/widgets/hub/`, and Hub as the default landing tab (`navOrder: 0`) are in place.

Most underlying data and UI primitives already exist because later phases shipped ahead of schedule (Standings Phase 6, Bracket Phase 4, Match Summary / `match_events` Phase 8, Settings team picker Phase 7). Phase 2 is primarily **orchestration + compact UI**, not greenfield domain work.

| Area | Status for Hub |
|------|----------------|
| Fixtures data + UI primitives | Ready |
| Standings data + `GroupTable` | Ready |
| Bracket data + visual components | Ready |
| Top scorers | Data exists (`match_events`); aggregation endpoint missing |
| Teams quick-links | Stub OK — `GET /api/teams/names` exists; full Teams widget (Phase 5) does not |
| Hub API + composer widget | **Not started** |

**Estimated effort:** ~2–3 dev days (backend aggregation + frontend composer + tests).

---

## Blueprint checklist

From the [Implementation Status Tracker](./fifa_2026_complete_blueprint.md#phase-2--hub-widget) in the main blueprint:

- [x] `GET /api/hub` aggregated endpoint
- [x] `src/widgets/hub/` — dashboard composer
- [x] Compact Fixtures preview embedded
- [x] Compact Standings preview embedded (live — Phase 6 complete)
- [x] Compact Bracket preview embedded (live — Phase 4 complete)
- [x] Top scorers section (live via `match_events`)
- [x] Teams quick-links section (live names grid)
- [x] Hub tab enabled in widget registry
- [ ] **Phase 2 signed off**

---

## What's already built

### Backend modules Hub can compose

| Module | Endpoint | Hub use |
|--------|----------|---------|
| `FixturesModule` | `GET /api/fixtures` | Upcoming + recent matches |
| `StandingsModule` | `GET /api/standings/groups` | Group table preview |
| `BracketModule` | `GET /api/bracket` | Knockout mini-tree |
| `MatchSummaryModule` | `GET /api/fixtures/:id/summary` | Events stored in `match_events` after fetch |
| `TeamsModule` | `GET /api/teams/names` | Quick-link grid (names + IDs only) |

`AppModule` today registers Fixtures, Bracket, Standings, MatchSummary, Teams, Users, and Notifications — **no `HubModule`**.

Each domain module already implements on-demand ESPN hydration with in-flight `syncPromise` guards (Production Hardening F3). Hub must **delegate** to those services, not duplicate ESPN calls.

### Frontend widgets and primitives

```
web/src/widgets/
  fixtures/   MatchCard, DayWiseFixturesList, findNearestUpcomingFixture, useFixtures
  standings/  GroupTable, useStandings
  bracket/    BracketCanvas, BracketMatchNode, useBracket
```

Widget registry (`web/src/shell/register-widgets.ts`) currently registers:

| Widget | Phase | navOrder | Route |
|--------|-------|----------|-------|
| Fixtures | 1 | 1 | `/` (default) |
| Standings | 6 | 2 | `/standings` |
| Bracket | 6 | 3 | `/bracket` |

`VITE_APP_PHASE` defaults to `7`, so all three tabs are visible in dev. Fixtures is the landing page.

### Top scorers data source

Per [`espn_api_signatures.md`](./espn_api_signatures.md):

> Hub scorers (Phase 2) — Derived from `match_events` table (Phase 8)

`match_events` stores `goal`, `penalty_goal`, `own_goal` with `player_name`, `team_id`, and `minute`. Live top scorers need only a SQL aggregation — no new ESPN integration.

**Caveat:** Goals appear only after finished matches have summaries fetched (Phase 8 lazy fetch on drawer open or first `GET /api/fixtures/:id/summary`). Hub should show helpful copy when `match_events` is sparse.

---

## Gap analysis — net new work

### 1. Backend: `GET /api/hub`

**Suggested file layout:**

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

Compose existing services; do not reimplement sync logic.

| Section | Source | Slice / behaviour |
|---------|--------|-------------------|
| `fixtures_preview` | `FixturesService` | Next 3 upcoming + last 3 finished |
| `standings_preview` | `StandingsService` | One group, top 4 rows (see [open decisions](#open-decisions)) |
| `bracket_preview` | `BracketService` | Semifinals + final slots, or last 2 rounds |
| `top_scorers` | New `TopScorersService` | Aggregate `match_events` goal types; limit 10 |
| `teams_quick_links` | `TeamsService.getPickerOptions()` | All followable nations sorted by name |

#### Refresh contract

- `GET /api/hub` — serve composed snapshot from Postgres (trigger domain sync only when underlying tables are empty).
- `GET /api/hub?refresh=true` — fan out `refresh=true` to fixtures and standings sync paths; bracket derives from fixtures automatically.
- Throttle: **20 req/min** (same as fixtures/bracket).
- One HTTP call from the client; server coordinates internally.

#### Proposed response shape

```json
{
  "fixtures_preview": {
    "upcoming": [],
    "recent_results": []
  },
  "standings_preview": {
    "available": true,
    "group": {
      "group_id": 1,
      "group_name": "Group A",
      "group_abbreviation": "A",
      "entries": []
    }
  },
  "bracket_preview": {
    "knockout_started": false,
    "highlights": []
  },
  "top_scorers": {
    "available": true,
    "entries": [
      {
        "rank": 1,
        "player_name": "Lionel Messi",
        "team": { "id": 10, "name": "Argentina" },
        "goals": 5
      }
    ]
  },
  "teams_quick_links": [
    { "id": 10, "name": "Argentina" }
  ]
}
```

Each section may return `{ "available": false }` when data is not ready — same empty-state philosophy as other widgets. Fixture entries reuse `FixtureResponseDto`; bracket nodes reuse `BracketNodeDto`.

#### `TopScorersService` aggregation rules

- Count events where `type IN ('goal', 'penalty_goal')`.
- Exclude `own_goal` from scorer totals (or count against opposing team — document choice in service).
- Group by `(player_name, team_id)`; tie-break alphabetically by `player_name`.
- Return top 10.

### 2. Frontend: `web/src/widgets/hub/`

**Suggested file layout:**

```
web/src/widgets/hub/
  HubWidget.tsx
  useHub.ts
  api.ts
  hub.module.css
  HubSkeleton.tsx
  sections/
    FixturesPreviewSection.tsx
    StandingsPreviewSection.tsx
    BracketPreviewSection.tsx
    TopScorersSection.tsx
    TeamsQuickLinksSection.tsx
```

#### Design principles

- Hub is a **layout composer** — reuses `MatchCard`, `GroupTable` (trimmed rows), and bracket node styling. Does **not** duplicate fetch logic from `useFixtures`, `useStandings`, or `useBracket`.
- Each section includes a **View all →** link to `/fixtures`, `/standings`, `/bracket`, or `/teams`.
- Mobile-first vertical scroll; `HubSkeleton` during API cold start.
- Followed-team highlights reuse `getFollowedTeamIds()` from Settings preferences (`localStorage`).
- `useHub` mirrors `useFixtures` cache/retry pattern (`readCache`, `writeCache`, `RETRY_DELAYS_MS`).

### 3. Widget registry and routing

Add to `register-widgets.ts`:

```typescript
registerWidget({
  id: 'hub',
  label: 'Hub',
  phase: 2,
  navOrder: 0, // first tab — becomes default landing at /
  lazy: () => import('../widgets/hub/HubWidget'),
});
```

`WidgetRouter` already treats the lowest `navOrder` enabled widget as `/`. Enabling Hub shifts the landing page from Fixtures → Hub without router changes. Fixtures moves to `/fixtures`.

### 4. Refresh architecture

`FixturesRefreshContext` holds **one** refresh handler — whichever widget is mounted sets it.

When Hub is active, `HubWidget` registers a handler that calls `GET /api/hub?refresh=true`. Full widgets keep their own handlers when navigated to directly.

**Optional follow-up (not blocking):** fan-out refresh so header refresh warms all client caches. Defer unless product requires refresh-on-Hub to also update fixtures/standings localStorage entries.

### 5. Stubs vs live

| Section | Recommendation | Rationale |
|---------|----------------|-----------|
| Fixtures preview | **Live** | Data + `MatchCard` exist |
| Standings preview | **Live** | Phase 6 complete |
| Bracket preview | **Live** with pre-R32 placeholder | Phase 4 complete |
| Top scorers | **Live** with empty fallback | `match_events` exists; ~1 SQL query |
| Teams quick-links | **Live names grid** | `GET /api/teams/names` works; `/teams` route shows empty state until Phase 5 |

---

## Implementation sequence

### Sprint A — Backend hub aggregation (~1 PR)

1. `TopScorersService` + unit tests (aggregation, ties, empty table).
2. `HubService` — inject Fixtures, Standings, Bracket, Teams services; slice responses.
3. `HubController` — `GET /api/hub`, throttle 20/min, `?refresh=true`.
4. `HubModule` → register in `AppModule`.
5. `hub.service.spec.ts` — empty DB, partial data, refresh fan-out.

### Sprint B — Frontend hub composer (~1 PR)

1. `useHub` + `api.ts`.
2. `HubSkeleton` + `HubWidget` scroll layout.
3. Five section components reusing existing primitives.
4. Register widget (`phase: 2`, `navOrder: 0`).
5. Wire `setRefreshHandler` to `useHub().refresh`.

### Sprint C — Polish and sign-off (~0.5 PR)

1. Followed-team highlights in previews.
2. Per-section empty/placeholder copy.
3. Update blueprint tracker checkboxes.
4. Manual test: cold start → hub loads → header refresh → section links navigate correctly.

---

## Architecture diagram

```
┌─────────────────────────────────────────────────────────────┐
│  HubWidget (scroll composer)                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │ Fixtures    │ │ Standings   │ │ Bracket     │  …         │
│  │ Preview     │ │ Preview     │ │ Preview     │            │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘            │
│         │               │               │                    │
│         └───────────────┴───────────────┘                    │
│                         │                                    │
│                   useHub()                                   │
│                         │                                    │
│              GET /api/hub[?refresh=true]                     │
└─────────────────────────┼────────────────────────────────────┘
                          v
┌─────────────────────────────────────────────────────────────┐
│  HubService (compose only — no direct ESPN calls)            │
│    ├── FixturesService                                       │
│    ├── StandingsService                                      │
│    ├── BracketService                                        │
│    ├── TopScorersService → match_events                      │
│    └── TeamsService.getPickerOptions()                       │
└─────────────────────────────────────────────────────────────┘
```

---

## $0 stack constraints

From [`product_architect_agent.md`](./product_architect_agent.md):

1. **One ESPN call per refresh path** — Hub `?refresh=true` must reuse in-flight `syncPromise` guards in Fixtures/Standings services.
2. **Small payloads** — Hub returns previews only; full lists stay on dedicated widget endpoints.
3. **Cold-start UX** — `HubSkeleton` on first paint; never a blank white screen.
4. **No cron** — Hub data updates only on user refresh or first-load hydration.
5. **Top scorers lag** — Goals appear after match summaries are fetched; show *"Scorers update as matches finish"* when sparse.

---

## Open decisions

Resolve before implementation:

| # | Decision | Options |
|---|----------|---------|
| 1 | Default standings group in preview | Followed teams' group · fixed Group A · rotate daily |
| 2 | Bracket preview depth | Final four only · last 2 full rounds · mini-tree |
| 3 | Own goals in scorer totals | Exclude from player count · attribute to scorer |
| 4 | `VITE_APP_PHASE` gating | Keep `7` in dev (all tabs) · gate Hub at `phase >= 2` only |

**Recommendation:** Followed teams' group (fallback Group A); final four for bracket preview; exclude own goals from scorer totals; keep `VITE_APP_PHASE=7` for dev.

---

## Test plan

### Backend

- `TopScorersService`: empty table, single player, tie on goals, own goals excluded.
- `HubService`: empty fixtures → `fixtures_preview` empty arrays; standings unavailable → `available: false`; `?refresh=true` calls domain refresh once each.
- Throttle: hub endpoint respects 20 req/min.

### Frontend

- Hub skeleton on cold start; no flash of empty layout.
- Section "View all" links route correctly.
- Header **Refresh** triggers `useHub` refresh when Hub is mounted.
- Followed teams highlighted in fixture and standings previews.
- Pre-knockout: bracket section shows placeholder copy.

### Manual E2E

1. Empty DB → open app → Hub hydrates via hub endpoint.
2. Tap Refresh in header → scores/standings update.
3. Navigate to full Fixtures/Standings/Bracket tabs → data consistent with hub previews.
4. Finished match with summary → top scorers section populates.

---

## Blueprint updates after ship

When Phase 2 lands, update [`fifa_2026_complete_blueprint.md`](./fifa_2026_complete_blueprint.md):

- Phase overview table: Phase 2 → `[x] Code complete`
- Phase 2 checklist items (lines 120–128) → checked
- Note that Hub shipped with **live** standings/bracket previews because Phases 4 and 6 completed first

---

## References

| Document | Relevance |
|----------|-----------|
| [`fifa_2026_complete_blueprint.md`](./fifa_2026_complete_blueprint.md) | Phase 2 scope, widget platform contract |
| [`product_architect_agent.md`](./product_architect_agent.md) | Hydration pattern, UX guardrails, SOLID |
| [`espn_api_signatures.md`](./espn_api_signatures.md) | Hub scorers derivation from `match_events` |
| `web/src/shell/registry.ts` | `TournamentWidget` contract |
| `api/src/match-summary/entities/match-event.entity.ts` | Top scorers source table |
