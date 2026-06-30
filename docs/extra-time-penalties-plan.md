# Extra Time & Penalty Shootouts — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show knockout-stage extra time and penalty shootout results in fixture cards and the match-summary drawer, sourced from ESPN's existing scoreboard and summary payloads.

**Architecture:** Extend the `fixtures` table with nullable penalty columns and a `decided_by` enum derived from ESPN `status.type.name` during the existing on-demand scoreboard sync. Extend match-summary parsing to ingest the ESPN `shootout` array into `match_events` with new shootout event types, and fix minute/extra-time classification for 90+ minute periods. Frontend score formatters consume the new API fields — no additional ESPN calls.

**Tech Stack:** NestJS + TypeORM (Postgres), React 19 PWA, Vitest/Jest unit tests, ESPN public JSON (no API key).

**Feasibility verdict:** ✅ **Yes — implementable today.** Verified against live FIFA 2026 knockout data (2026-06-30).

---

## 1. Feasibility Analysis

### 1.1 What users see today (the gap)

| Surface | Current behaviour | Expected for knockouts |
| :--- | :--- | :--- |
| **Fixture list (`MatchCard`)** | `1 – 1` only | `1 – 1 (3–4 pens)` or `2 – 1 AET` |
| **Summary drawer header** | Same flat score | Regulation score + pens/AET annotation |
| **Match events timeline** | Regulation goals/cards only | ET goals at 91'+; separate shootout section |
| **Penalty shootout detail** | Not shown | Per-kicker scored/missed list |

### 1.2 ESPN data already available (verified live)

**Scoreboard** (`GET …/fifa.world/scoreboard`) — used by `FixturesSyncService`:

| ESPN field | Example (Germany 1–1 Paraguay, pens) | Currently mapped? |
| :--- | :--- | :--- |
| `competitors[].score` | `"1"` / `"1"` (regulation + ET, **excludes** shootout) | ✅ Yes → `home_score` / `away_score` |
| `competitors[].shootoutScore` | `3` / `4` | ❌ Ignored |
| `status.type.name` | `STATUS_FINAL_PEN` | ❌ Collapsed to generic `finished` |
| `status.type.detail` | `FT-Pens` | ❌ Ignored |
| `notes[].text` | `"Paraguay advance 4-3 on penalties"` | ❌ Ignored |

Other terminal status names to handle (from ESPN soccer vocabulary):

| ESPN `status.type.name` | Meaning | Planned `decided_by` |
| :--- | :--- | :--- |
| `STATUS_FULL_TIME` | Decided in regulation | `regulation` |
| `STATUS_AFTER_EXTRA_TIME` | Decided in extra time | `extra_time` |
| `STATUS_FINAL_PEN` | Draw after ET; decided on pens | `penalties` |
| `STATUS_AFTER_SHOOTOUT` | Alias seen in other leagues | `penalties` |

**Summary** (`GET …/fifa.world/summary?event={id}`) — used by `MatchSummaryService`:

| ESPN field | Contents | Currently mapped? |
| :--- | :--- | :--- |
| `shootout[]` | Per-team ordered shots: `{ player, didScore, shotNumber }` | ❌ Ignored |
| `header.competitions[].competitors[].linescores` | `[HT, 2H, ET1, ET2, Pens]` period scores | ❌ Ignored |
| `keyEvents[]` / `scoringPlays[]` | Goals with clock e.g. `"42'"`, `"105'"` | ⚠️ Partial — ET minutes > 90 not flagged as extra time |
| `status.type.detail` | `FT-Pens` | ❌ Ignored |

**Sample shootout payload** (event `760489`, Germany vs Paraguay):

```json
"shootout": [
  {
    "id": "481",
    "team": "Germany",
    "shots": [
      { "player": "Kai Havertz", "shotNumber": 1, "didScore": false },
      { "player": "Joshua Kimmich", "shotNumber": 2, "didScore": true }
    ]
  }
]
```

### 1.3 Constraints respected

- **Zero budget:** No new endpoints or paid APIs — data is in payloads we already fetch.
- **On-demand hydration:** Penalty columns populate on first load / `?refresh=true` via existing scoreboard sync.
- **Summary idempotency:** Shootout events stored once alongside existing events; backfill path for fixtures already cached before this ships (see Task 6).
- **No live polling:** Unchanged.

---

## 2. Proposed Data Model

### 2.1 `fixtures` table — new columns

| Column | Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `decided_by` | `VARCHAR(20)` | NOT NULL, default `'regulation'` | How the winner was decided |
| `home_penalty_score` | `INT` | YES | Shootout goals scored (null when N/A) |
| `away_penalty_score` | `INT` | YES | Shootout goals scored (null when N/A) |

`decided_by` values: `'regulation'` | `'extra_time'` | `'penalties'`.

**Score semantics (unchanged for regulation score):**

- `home_score` / `away_score` = goals after 120 minutes (regulation + ET). ESPN `competitor.score` already returns this correctly.
- Penalty shootout totals live in `home_penalty_score` / `away_penalty_score`.

### 2.2 `match_events` — new event types

Extend the existing CHECK constraint / TypeScript union:

| New type | Meaning |
| :--- | :--- |
| `shootout_goal` | Penalty scored in shootout |
| `shootout_miss` | Penalty missed/saved in shootout |

Shootout events use `minute = null`, `is_extra_time = false`, and are ordered after regulation/ET events via `event_order`.

### 2.3 API response shapes

**`GET /api/fixtures`** — add three fields:

```json
{
  "home_score": 1,
  "away_score": 1,
  "decided_by": "penalties",
  "home_penalty_score": 3,
  "away_penalty_score": 4
}
```

**`GET /api/fixtures/:id/summary`** — events array gains shootout entries; no new top-level key required (timeline grouping is a frontend concern).

---

## 3. File Map

| Action | File | Responsibility |
| :--- | :--- | :--- |
| Create | `api/src/migrations/1749750000000-AddFixtureDecidedByAndPenaltyScores.ts` | Schema migration |
| Modify | `api/src/fixtures/entities/fixture.entity.ts` | New columns |
| Modify | `api/src/fixtures/espn.types.ts` | `shootoutScore`, status detail types |
| Modify | `api/src/fixtures/espn.mapper.ts` | Map `decided_by`, penalty scores |
| Create | `api/src/fixtures/decided-by.ts` | Pure: `mapDecidedBy(statusName, detail)` |
| Create | `api/src/fixtures/decided-by.spec.ts` | Unit tests for status mapping |
| Modify | `api/src/fixtures/dto/fixture-response.dto.ts` | Expose new fields |
| Modify | `api/src/fixtures/fixtures.mapper.ts` | Pass through new fields |
| Modify | `api/src/fixtures/fixtures.mapper.spec.ts` | Assert new fields in DTO |
| Modify | `api/src/fixtures/fixtures-sync.service.spec.ts` | Penalty-match snapshot test |
| Modify | `api/src/match-summary/espn-summary.types.ts` | `shootout` array types |
| Modify | `api/src/match-summary/entities/match-event.entity.ts` | New event types |
| Modify | `api/src/migrations/1749650100000-CreateMatchEventsTable.ts` | **Do not edit** — new migration alters CHECK |
| Create | `api/src/migrations/1749750100000-AddShootoutEventTypes.ts` | Widen event type constraint |
| Modify | `api/src/match-summary/match-summary.service.ts` | Parse shootout; fix ET minute logic |
| Modify | `api/src/match-summary/match-summary.service.spec.ts` | Shootout + ET minute tests |
| Create | `web/src/widgets/fixtures/formatFixtureScore.ts` | Pure score formatter |
| Create | `web/src/widgets/fixtures/formatFixtureScore.test.ts` | Formatter tests |
| Modify | `web/src/widgets/fixtures/types.ts` | Fixture + event type extensions |
| Modify | `web/src/widgets/fixtures/MatchCard.tsx` | Use `formatFixtureScore` |
| Modify | `web/src/widgets/fixtures/MatchSummaryDrawer.tsx` | Score header + shootout section |
| Modify | `web/src/widgets/fixtures/matchSummaryHelpers.ts` | Icons/labels for shootout types; improve `formatMinute` |
| Modify | `web/src/widgets/fixtures/matchSummaryHelpers.test.ts` | New helper tests |
| Modify | `docs/espn_api_signatures.md` | Document new mappings |

---

## 4. Implementation Tasks

### Task 1: `decided_by` mapper (backend pure function)

**Files:**
- Create: `api/src/fixtures/decided-by.ts`
- Create: `api/src/fixtures/decided-by.spec.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { mapDecidedBy } from './decided-by';

describe('mapDecidedBy', () => {
  it('returns regulation for STATUS_FULL_TIME', () => {
    expect(mapDecidedBy('STATUS_FULL_TIME', 'FT')).toBe('regulation');
  });
  it('returns extra_time for STATUS_AFTER_EXTRA_TIME', () => {
    expect(mapDecidedBy('STATUS_AFTER_EXTRA_TIME', 'AET')).toBe('extra_time');
  });
  it('returns penalties for STATUS_FINAL_PEN', () => {
    expect(mapDecidedBy('STATUS_FINAL_PEN', 'FT-Pens')).toBe('penalties');
  });
  it('returns penalties for STATUS_AFTER_SHOOTOUT', () => {
    expect(mapDecidedBy('STATUS_AFTER_SHOOTOUT', 'Pens')).toBe('penalties');
  });
  it('defaults to regulation for unknown status', () => {
    expect(mapDecidedBy(undefined, undefined)).toBe('regulation');
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `cd api && npm test -- decided-by.spec.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement**

```typescript
export type DecidedBy = 'regulation' | 'extra_time' | 'penalties';

const PENALTY_STATUSES = new Set(['STATUS_FINAL_PEN', 'STATUS_AFTER_SHOOTOUT']);
const EXTRA_TIME_STATUSES = new Set(['STATUS_AFTER_EXTRA_TIME']);

export function mapDecidedBy(
  statusName?: string,
  _detail?: string,
): DecidedBy {
  if (!statusName) return 'regulation';
  if (PENALTY_STATUSES.has(statusName)) return 'penalties';
  if (EXTRA_TIME_STATUSES.has(statusName)) return 'extra_time';
  return 'regulation';
}
```

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add api/src/fixtures/decided-by.ts api/src/fixtures/decided-by.spec.ts
git commit -m "feat(api): add ESPN decided_by status mapper"
```

---

### Task 2: Database migration + entity

**Files:**
- Create: `api/src/migrations/1749750000000-AddFixtureDecidedByAndPenaltyScores.ts`
- Modify: `api/src/fixtures/entities/fixture.entity.ts`

- [ ] **Step 1: Write migration**

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFixtureDecidedByAndPenaltyScores1749750000000
  implements MigrationInterface
{
  name = 'AddFixtureDecidedByAndPenaltyScores1749750000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE fixtures
        ADD COLUMN decided_by VARCHAR(20) NOT NULL DEFAULT 'regulation',
        ADD COLUMN home_penalty_score INT,
        ADD COLUMN away_penalty_score INT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE fixtures
        DROP COLUMN IF EXISTS away_penalty_score,
        DROP COLUMN IF EXISTS home_penalty_score,
        DROP COLUMN IF EXISTS decided_by
    `);
  }
}
```

- [ ] **Step 2: Add columns to `FixtureEntity`**

```typescript
import { DecidedBy } from '../decided-by';

@Column({ type: 'varchar', length: 20, default: 'regulation' })
decided_by!: DecidedBy;

@Column({ type: 'int', nullable: true })
home_penalty_score!: number | null;

@Column({ type: 'int', nullable: true })
away_penalty_score!: number | null;
```

- [ ] **Step 3: Run migration locally**

Run: `cd api && npm run migration:run:local`
Expected: migration applies cleanly

- [ ] **Step 4: Commit**

---

### Task 3: ESPN scoreboard mapper — penalty scores

**Files:**
- Modify: `api/src/fixtures/espn.types.ts`
- Modify: `api/src/fixtures/espn.mapper.ts`
- Modify: `api/src/fixtures/espn.mapper.spec.ts` (or `fixtures-sync.service.spec.ts`)

- [ ] **Step 1: Extend `EspnCompetitor`**

```typescript
shootoutScore?: number;
```

- [ ] **Step 2: Write failing test for penalty fixture**

Use snapshot derived from live event `760489`:

```typescript
it('maps penalty shootout scores and decided_by', () => {
  const entity = mapEspnEvent(penaltyFixtureEvent, 50);
  expect(entity.home_score).toBe(1);
  expect(entity.away_score).toBe(1);
  expect(entity.home_penalty_score).toBe(3);
  expect(entity.away_penalty_score).toBe(4);
  expect(entity.decided_by).toBe('penalties');
});
```

- [ ] **Step 3: Extend `mapEspnEvent`**

```typescript
import { mapDecidedBy } from './decided-by';

// Inside mapEspnEvent, after scores:
const statusName = competition?.status?.type?.name;
const statusDetail = competition?.status?.type?.detail;
entity.decided_by = mapDecidedBy(statusName, statusDetail);

const homeShootout = homeCompetitor?.shootoutScore;
const awayShootout = awayCompetitor?.shootoutScore;
entity.home_penalty_score =
  entity.decided_by === 'penalties' && homeShootout != null
    ? homeShootout
    : null;
entity.away_penalty_score =
  entity.decided_by === 'penalties' && awayShootout != null
    ? awayShootout
    : null;
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `cd api && npm test -- espn.mapper`

- [ ] **Step 5: Expose via DTO + fixtures.mapper**

Add to `FixtureResponseDto` and `toFixtureResponseDto`:

```typescript
decided_by: DecidedBy;
home_penalty_score: number | null;
away_penalty_score: number | null;
```

- [ ] **Step 6: Commit**

---

### Task 4: Frontend score formatter

**Files:**
- Create: `web/src/widgets/fixtures/formatFixtureScore.ts`
- Create: `web/src/widgets/fixtures/formatFixtureScore.test.ts`
- Modify: `web/src/widgets/fixtures/types.ts`
- Modify: `web/src/widgets/fixtures/MatchCard.tsx`
- Modify: `web/src/widgets/fixtures/MatchSummaryDrawer.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
import { formatFixtureScore, formatFixtureScoreMeta } from './formatFixtureScore';

describe('formatFixtureScore', () => {
  const base = {
    status: 'finished' as const,
    home_score: 1,
    away_score: 1,
    decided_by: 'regulation' as const,
    home_penalty_score: null,
    away_penalty_score: null,
  };

  it('returns null for scheduled matches', () => {
    expect(formatFixtureScore({ ...base, status: 'scheduled', home_score: null })).toBeNull();
  });
  it('returns plain score for regulation', () => {
    expect(formatFixtureScore({ ...base, home_score: 2, away_score: 1 })).toBe('2 – 1');
  });
  it('returns score with pens suffix', () => {
    expect(
      formatFixtureScore({
        ...base,
        decided_by: 'penalties',
        home_penalty_score: 3,
        away_penalty_score: 4,
      }),
    ).toBe('1 – 1 (3–4)');
  });
});

describe('formatFixtureScoreMeta', () => {
  it('returns "AET" for extra_time', () => {
    expect(formatFixtureScoreMeta('extra_time')).toBe('AET');
  });
  it('returns "Pens" for penalties', () => {
    expect(formatFixtureScoreMeta('penalties')).toBe('Pens');
  });
  it('returns null for regulation', () => {
    expect(formatFixtureScoreMeta('regulation')).toBeNull();
  });
});
```

- [ ] **Step 2: Implement formatter**

```typescript
import type { Fixture } from './types';

export function formatFixtureScore(fixture: Pick<
  Fixture,
  'status' | 'home_score' | 'away_score' | 'decided_by' | 'home_penalty_score' | 'away_penalty_score'
>): string | null {
  if (fixture.status !== 'finished') return null;
  if (fixture.home_score === null || fixture.away_score === null) return null;

  const base = `${fixture.home_score} – ${fixture.away_score}`;
  if (
    fixture.decided_by === 'penalties' &&
    fixture.home_penalty_score != null &&
    fixture.away_penalty_score != null
  ) {
    return `${base} (${fixture.home_penalty_score}–${fixture.away_penalty_score})`;
  }
  return base;
}

export function formatFixtureScoreMeta(decidedBy: Fixture['decided_by']): string | null {
  if (decidedBy === 'extra_time') return 'AET';
  if (decidedBy === 'penalties') return 'Pens';
  return null;
}
```

- [ ] **Step 3: Wire into `MatchCard`**

Replace local `formatScore` with `formatFixtureScore(fixture)`. Optionally render a small meta badge when `formatFixtureScoreMeta` returns a value and pens suffix is not already in the score string.

- [ ] **Step 4: Run tests**

Run: `cd web && npm test -- formatFixtureScore`

- [ ] **Step 5: Commit**

---

### Task 5: Shootout events in match summary

**Files:**
- Create: `api/src/migrations/1749750100000-AddShootoutEventTypes.ts`
- Modify: `api/src/match-summary/entities/match-event.entity.ts`
- Modify: `api/src/match-summary/espn-summary.types.ts`
- Modify: `api/src/match-summary/match-summary.service.ts`
- Modify: `api/src/match-summary/match-summary.service.spec.ts`

- [ ] **Step 1: Migration to widen event type CHECK**

```sql
ALTER TABLE match_events DROP CONSTRAINT IF EXISTS match_events_type_check;
ALTER TABLE match_events ADD CONSTRAINT match_events_type_check
  CHECK (type IN (
    'goal','own_goal','penalty_goal','penalty_miss',
    'yellow_card','red_card',
    'shootout_goal','shootout_miss'
  ));
```

- [ ] **Step 2: Add ESPN shootout types**

```typescript
export interface EspnShootoutShot {
  player?: string;
  shotNumber?: number;
  didScore?: boolean;
}

export interface EspnShootoutTeam {
  id?: string;
  team?: string;
  shots?: EspnShootoutShot[];
}

export interface EspnSummaryResponse {
  // existing fields…
  shootout?: EspnShootoutTeam[];
}
```

- [ ] **Step 3: Write failing test**

```typescript
it('appends shootout events after regulation events', async () => {
  httpService.get.mockReturnValue(of({ data: SHOOTOUT_SUMMARY_FIXTURE }));
  const result = await service.getSummary(760489);
  const types = (result as any).events.map((e: any) => e.type);
  expect(types).toContain('shootout_goal');
  expect(types).toContain('shootout_miss');
});
```

- [ ] **Step 4: Implement `mapShootoutEvents`**

```typescript
private mapShootoutEvents(
  fixtureId: number,
  teams: EspnShootoutTeam[],
  startOrder: number,
): MatchEventEntity[] {
  const entities: MatchEventEntity[] = [];
  let order = startOrder;

  for (const teamBlock of teams) {
    const teamId = teamBlock.id ? parseInt(teamBlock.id, 10) : null;
    for (const shot of teamBlock.shots ?? []) {
      const e = new MatchEventEntity();
      e.fixture_id = fixtureId;
      e.event_order = order++;
      e.type = shot.didScore ? 'shootout_goal' : 'shootout_miss';
      e.team_id = teamId;
      e.player_name = shot.player ?? null;
      e.assist_name = null;
      e.minute = null;
      e.is_extra_time = false;
      entities.push(e);
    }
  }
  return entities;
}
```

Call from `mapEvents` / `fetchStoreAndReturn` after regulation events:

```typescript
const regulationEvents = /* existing logic */;
const shootoutEvents = this.mapShootoutEvents(
  fixture.id,
  espnData.shootout ?? [],
  regulationEvents.length,
);
const eventEntities = [...regulationEvents, ...shootoutEvents];
```

- [ ] **Step 5: Fix extra-time minute detection**

Replace `isExtraTime` in `match-summary.service.ts`:

```typescript
function classifyMinute(displayValue: string | undefined): {
  minute: number | null;
  is_stoppage: boolean;
  is_extra_period: boolean;
} {
  if (!displayValue) return { minute: null, is_stoppage: false, is_extra_period: false };
  const stoppage = displayValue.includes('+');
  const match = displayValue.match(/^(\d+)/);
  const minute = match ? parseInt(match[1], 10) : null;
  const is_extra_period = minute != null && minute > 90 && !stoppage;
  return { minute, is_stoppage: stoppage, is_extra_period };
}
```

Store `is_extra_time = is_stoppage || is_extra_period` (covers both 45+2' and 105').

- [ ] **Step 6: Run tests — expect PASS**

- [ ] **Step 7: Commit**

---

### Task 6: Summary drawer shootout UI

**Files:**
- Modify: `web/src/widgets/fixtures/matchSummaryHelpers.ts`
- Modify: `web/src/widgets/fixtures/matchSummaryHelpers.test.ts`
- Modify: `web/src/widgets/fixtures/MatchSummaryDrawer.tsx`
- Modify: `web/src/widgets/fixtures/fixtures.module.css`

- [ ] **Step 1: Extend helpers**

```typescript
// types.ts — add to MatchEventType union:
// 'shootout_goal' | 'shootout_miss'

// matchSummaryHelpers.ts
case 'shootout_goal': return '✅';
case 'shootout_miss': return '❌';

case 'shootout_goal': return 'Scored';
case 'shootout_miss': return 'Missed';

export function isShootoutEvent(type: MatchEventType): boolean {
  return type === 'shootout_goal' || type === 'shootout_miss';
}
```

- [ ] **Step 2: Split events in drawer**

```typescript
const regulationEvents = summary.events.filter((e) => !isShootoutEvent(e.type));
const shootoutEvents = summary.events.filter((e) => isShootoutEvent(e.type));
```

Render two sections: **Match Events** (existing) and **Penalty Shootout** (new, only when `shootoutEvents.length > 0`). Shootout rows show player name + Scored/Missed label; no minute column.

- [ ] **Step 3: Update drawer header**

Use `formatFixtureScore(fixture)` instead of inline score string.

- [ ] **Step 4: Add minimal CSS for shootout section title (reuse `.drawerSectionTitle`)**

- [ ] **Step 5: Run frontend tests**

Run: `cd web && npm test`

- [ ] **Step 6: Commit**

---

### Task 7: Backfill path for already-cached summaries

**Files:**
- Modify: `api/src/match-summary/match-summary.service.ts`

Fixtures that already have `summary_fetched = true` (e.g. Germany–Paraguay synced before this feature) will lack shootout events.

- [ ] **Step 1: Write failing test**

```typescript
it('re-fetches shootout events when fixture decided_by is penalties but cache lacks shootout events', async () => {
  fixturesRepository.findOne.mockResolvedValue(
    makeFixture({ summary_fetched: true, decided_by: 'penalties' }),
  );
  eventsRepository.find.mockResolvedValue([/* regulation-only events */]);
  // expect ESPN call + shootout append
});
```

- [ ] **Step 2: Implement guard in `getSummary`**

After loading cached events, if `fixture.decided_by === 'penalties'` and no cached event has type `shootout_goal|shootout_miss`, call a lightweight `backfillShootout(fixture)` that fetches ESPN summary, maps only shootout events, appends to DB.

- [ ] **Step 3: Run tests — expect PASS**

- [ ] **Step 4: Commit**

---

### Task 8: Documentation + manual verification

**Files:**
- Modify: `docs/espn_api_signatures.md`

- [ ] **Step 1: Add section 3.4 — Knockout score mapping**

Document `shootoutScore`, `decided_by` status names, and summary `shootout` array.

- [ ] **Step 2: Manual test checklist**

1. Tap **Refresh** in Settings → confirm Germany–Paraguay shows `1 – 1 (3–4)` on fixture card.
2. Open match summary → confirm regulation goals at 42' and 54'; shootout section lists Havertz miss, etc.
3. Confirm a regulation knockout (e.g. 0–1 FT) still shows plain score with no pens suffix.
4. After deploy, run `npm run migration:run` on Neon.

- [ ] **Step 3: Commit**

```bash
git add docs/espn_api_signatures.md
git commit -m "docs: document ESPN extra time and penalty mappings"
```

---

## 5. UX Reference

### Fixture card score formats

| Scenario | Display |
| :--- | :--- |
| Group stage / regulation KO | `2 – 1` |
| Decided in extra time | `2 – 1` + small **AET** badge |
| Decided on penalties | `1 – 1 (3–4)` |

### Summary drawer layout

```
┌─────────────────────────────┐
│  🇩🇪 Germany   1 – 1 (3–4)  🇵🇾 Paraguay  │
├─────────────────────────────┤
│  Match Events               │
│  42' ⚽ Julio Enciso         │
│  54' ⚽ Kai Havertz          │
├─────────────────────────────┤
│  Penalty Shootout           │
│  ✅ Joshua Kimmich          │
│  ❌ Kai Havertz             │
│  …                          │
├─────────────────────────────┤
│  Team Stats                 │
└─────────────────────────────┘
```

---

## 6. Risks & Mitigations

| Risk | Mitigation |
| :--- | :--- |
| ESPN renames status constants | Centralize in `decided-by.ts`; unit-test all known values |
| `shootout` array absent on some matches | Fall back to penalty totals from scoreboard columns only; hide shootout timeline section |
| Already-cached summaries missing shootout | Task 7 backfill on next drawer open |
| `is_extra_time` conflates stoppage vs ET period | `formatMinute` shows `45+'` for stoppage, `105'` for ET — acceptable FIFA-adjacent display |
| Migration on production Neon | Standard `migration:run` in deploy pipeline |

---

## 7. Out of Scope (YAGNI)

- Period-by-period score breakdown (HT / ET1 / ET2) — `linescores` available but not needed for MVP.
- Push notification copy changes for penalty results.
- Live in-match ET minute tracking (no live UI per product spec).
- Re-fetching summaries for ET-only matches that were cached with wrong `is_extra_time` flags (low impact until AET-only KO occurs; can add later).

---

## 8. Self-Review Checklist

| Requirement | Task |
| :--- | :--- |
| Penalty score on fixture list | Task 3 + 4 |
| AET indicator | Task 3 + 4 |
| Shootout timeline in summary | Task 5 + 6 |
| ET goal minutes correct | Task 5 (`classifyMinute`) |
| Backfill existing data | Task 7 + user Refresh for fixtures |
| ESPN docs updated | Task 8 |
| Zero new API calls for fixtures | ✅ Uses existing scoreboard fields |
| TDD coverage | Each task includes failing test first |
