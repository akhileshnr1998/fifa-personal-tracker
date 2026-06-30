# ESPN Public API — Request Signatures for FIFA 2026 App

> **Sources:**
> - [Public ESPN API (community docs)](https://github.com/pseudo-r/Public-ESPN-API)
> - [ESPN hidden API gist](https://gist.github.com/akeaswaran/b48b02f1c94f873c6655e7129910fc3b)
> - Mapped to requirements in [`fifa_2026_complete_blueprint.md`](./fifa_2026_complete_blueprint.md)
>
> **Last updated:** 2026-06-12

---

## 1. Scope & Hydration Policy

This app uses **On-Demand Hydration**: Postgres is the source of truth at runtime; ESPN is called only when the database is empty or the user explicitly refreshes.

| Trigger | Our API | ESPN call |
| :--- | :--- | :--- |
| First load (empty DB) | `GET /api/fixtures` | Yes — full tournament sync (scoreboard) |
| Normal load | `GET /api/fixtures` | No — serve from Postgres |
| User taps **Refresh** → Refresh | `GET /api/fixtures?refresh=true` | Yes — re-fetch and upsert |
| First standings load (empty DB) | `GET /api/standings/groups` | Yes — full standings sync |
| Normal standings load | `GET /api/standings/groups` | No — serve from Postgres |
| User taps **Refresh** → Refresh (standings) | `GET /api/standings/groups?refresh=true` | Yes — re-fetch and upsert |
| Push reminders | `POST /api/notifications/check-reminders` | No — reads local fixtures only |

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

### 3.4 Knockout score mapping (extra time & penalties)

| ESPN field | Example | App field |
| :--- | :--- | :--- |
| `competitors[].score` | `"1"` / `"1"` | `home_score` / `away_score` (regulation + ET, excludes shootout) |
| `competitors[].shootoutScore` | `3` / `4` | `home_penalty_score` / `away_penalty_score` (only when `decided_by === 'penalties'`) |
| `status.type.name` | `STATUS_FINAL_PEN` | `decided_by: 'penalties'` |
| `status.type.name` | `STATUS_AFTER_EXTRA_TIME` | `decided_by: 'extra_time'` |
| `status.type.name` | `STATUS_FULL_TIME` | `decided_by: 'regulation'` |
| `status.type.detail` | `FT-Pens`, `AET` | Informational — mapped via `mapDecidedBy()` in `api/src/fixtures/decided-by.ts` |

Penalty shootout totals are populated during the existing scoreboard sync (`FixturesSyncService`). No additional ESPN calls.

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
  "away_score": 1,
  "decided_by": "regulation",
  "home_penalty_score": null,
  "away_penalty_score": null
}
```

Penalty shootout example:

```json
{
  "status": "finished",
  "home_score": 1,
  "away_score": 1,
  "decided_by": "penalties",
  "home_penalty_score": 3,
  "away_penalty_score": 4
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

## 5. Group Standings Endpoint (Phase 6)

**Used by:** `StandingsSyncService.syncFromEspn()` on empty `tournament_groups` table or `?refresh=true`.

```http
GET https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings
```

No query parameters required. Returns all 12 groups × 4 teams = 48 entries in a single response.

### 5.1 Response shape

```
response.children[i]                   → one group (Group A … Group L)
  .id                                  → tournament_groups.espn_group_id
  .name                                → tournament_groups.name  ("Group A")
  .abbreviation                        → tournament_groups.abbreviation  ("A")
  .standings.entries[j]                → one team's row in that group
    .team.id                           → group_standings.team_id → teams.id
    .team.displayName                  → teams.name  (upserted if absent)
    .note.description                  → group_standings.qualification_label
    .note.color                        → group_standings.qualification_color
    .stats[k].name / .stats[k].value   → stat fields (see mapping below)
```

### 5.2 ESPN stats → DB column mapping

| `stats[k].name` | DB column | `shortDisplayName` |
| :--- | :--- | :--- |
| `gamesPlayed` | `games_played` | GP |
| `wins` | `wins` | W |
| `ties` | `draws` | D |
| `losses` | `losses` | L |
| `pointsFor` | `goals_for` | F |
| `pointsAgainst` | `goals_against` | A |
| `pointDifferential` | `goal_diff` | GD |
| `points` | `points` | P |
| `rank` | `rank` | Rank |
| `rankChange` | `rank_change` | Rank Change |

### 5.3 Qualification colour bands

`entries[j].note.color` maps to `qualification_color`:

| Hex | Meaning |
| :--- | :--- |
| `#81D6AC` | Advance to Round of 32 |
| `#FAD9A1` | Borderline / tiebreaker pending |
| `#F5A5A5` | Eliminated |

### 5.4 Our API response

```json
[
  {
    "group_id": 1,
    "group_name": "Group A",
    "group_abbreviation": "A",
    "entries": [
      {
        "rank": 1,
        "rank_change": 0,
        "team": { "id": 203, "name": "Mexico" },
        "games_played": 1,
        "wins": 1,
        "draws": 0,
        "losses": 0,
        "goals_for": 2,
        "goals_against": 1,
        "goal_diff": 1,
        "points": 3,
        "qualification_label": "Advance to Round of 32",
        "qualification_color": "#81D6AC"
      }
    ]
  }
]
```

---

## 6. Match Summary Endpoint (Phase 8)

**Used by:** `MatchSummaryService.fetchAndStore()` — called once per finished fixture, never again (`summary_fetched` flag).

```http
GET https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary
  ?event={espn_event_id}
```

No API key required. `espn_event_id` is already stored as `fixtures.id`.

**Guards before calling this endpoint:**

| Guard | Check | Result if fails |
| :--- | :--- | :--- |
| Status guard | `fixture.status === 'finished'` | Return `{ available: false }` — no ESPN call |
| Idempotency guard | `fixture.summary_fetched === false` | Return cached DB rows — no ESPN call |

### 6.1 Response shape → DB mapping

```
response.boxscore.teams[i]                   → one team's stats row (match_stats)
  .team.id                                   → match_stats.team_id
  .statistics[k].name / .displayValue        → see stat mapping below

response.scoringPlays[j]                     → one match event (match_events)
  .team.id                                   → match_events.team_id
  .clock.displayValue                        → match_events.minute  ("23'" → 23)
  .type.text                                 → match_events.type  (see type mapping)
  .athletesInvolved[0].displayName           → match_events.player_name
  .athletesInvolved[1].displayName           → match_events.assist_name  (goals only)

response.shootout[i].shots[j]                → shootout event (appended after regulation events)
  .team.id (via parent block)                 → match_events.team_id
  .player                                     → match_events.player_name
  .didScore                                   → shootout_goal | shootout_miss
  (minute always null)
```

Extra-time minute classification: clocks like `"105'"` set `is_extra_time: true`; stoppage time like `"45+2'"` also sets `is_extra_time: true`.

**Backfill:** If `fixture.decided_by === 'penalties'` but cached events lack shootout types, the service re-fetches ESPN summary and appends shootout rows only.

### 6.2 Event type mapping

| ESPN `type.text` | `match_events.type` |
| :--- | :--- |
| `Goal` | `goal` |
| `Own Goal` | `own_goal` |
| `Penalty - Goal` | `penalty_goal` |
| `Penalty - Miss` / `Penalty - Saved` | `penalty_miss` |
| `Yellow Card` | `yellow_card` |
| `Red Card` | `red_card` |
| `Yellow-Red Card` | `red_card` |
| `shootout[].shots[].didScore: true` | `shootout_goal` |
| `shootout[].shots[].didScore: false` | `shootout_miss` |

### 6.3 Stat name mapping

| ESPN `statistics[k].name` | `match_stats` column |
| :--- | :--- |
| `possessionPct` | `possession_pct` |
| `totalShots` | `shots` |
| `shotsOnTarget` | `shots_on_target` |
| `corners` | `corners` |
| `foulsCommitted` | `fouls` |
| `yellowCards` | `yellow_cards` |
| `redCards` | `red_cards` |
| `offsides` | `offsides` |
| `saves` | `saves` |

### 6.4 Our API response

```json
{
  "fixture_id": 760415,
  "available": true,
  "events": [
    {
      "type": "goal",
      "minute": 23,
      "team_id": 203,
      "player_name": "Hirving Lozano",
      "assist_name": "Chucky Lozano",
      "is_extra_time": false
    },
    {
      "type": "yellow_card",
      "minute": 45,
      "team_id": 467,
      "player_name": "Percy Tau",
      "assist_name": null,
      "is_extra_time": false
    }
  ],
  "stats": [
    {
      "team_id": 203,
      "possession_pct": 58.3,
      "shots": 12,
      "shots_on_target": 5,
      "corners": 6,
      "fouls": 9,
      "yellow_cards": 1,
      "red_cards": 0,
      "offsides": 2,
      "saves": 3
    }
  ]
}
```

Unfinished match response:
```json
{ "fixture_id": 760416, "available": false }
```

---

## 7. Future Phases — Additional ESPN Endpoints

| Widget | ESPN endpoint | Notes |
| :--- | :--- | :--- |
| Teams (Phase 5) | `/sports/soccer/fifa.world/teams` | Rosters via `/teams/{id}/roster` |
| Hub scorers (Phase 2) | Derived from `match_events` table (Phase 8) | Goal scorers available once Phase 8 ships — see [phase-2-hub-widget-plan.md](./phase-2-hub-widget-plan.md) |

All future widgets should follow the same on-demand refresh pattern.

---

## 8. Implementation Notes

1. **Three-step sync** — `FixturesSyncService.syncFromEspn()` upserts `teams`, then `venues`, then `fixtures` with `home_team_id` / `away_team_id` / `venue_id` FKs.
2. **No seed migration** — data hydrates from ESPN on first API request; no static seed file.
3. **Rate limits** — One HTTP call per refresh; be respectful (no polling).
4. **Unofficial API** — ESPN may change response shape without notice; keep mapper unit tests with fixture JSON snapshots.
5. **Fresh database test** — drop all tables or reset Neon branch, run `npm run migration:run:local`, open app → first load hydrates from ESPN.
6. **Concurrent cold-start protection** — `FixturesService` and `StandingsService` hold an in-flight `syncPromise`; multiple simultaneous requests during Render cold start share one ESPN fetch.
7. **Rate limiting** — `GET /api/fixtures` is throttled to 20 requests/min per IP by `@nestjs/throttler` to protect against ESPN sync exhaustion. The global default is 30/min across all other endpoints.

---

## 9. Documentation Index

| Topic | URL |
| :--- | :--- |
| Public ESPN API (soccer) | https://github.com/pseudo-r/Public-ESPN-API/blob/main/docs/sports/soccer.md |
| ESPN hidden API gist | https://gist.github.com/akeaswaran/b48b02f1c94f873c6655e7129910fc3b |
