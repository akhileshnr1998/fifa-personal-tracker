# Match Summary Drawer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a user taps a finished `MatchCard`, a slide-up drawer opens, fetches `GET /api/fixtures/:id/summary`, and displays the goal/card timeline and a dual team-stats comparison bar.

**Architecture:** The drawer is mounted inside `DayWiseFixturesList` and uses `position: fixed` to float above the page without a React portal. A new `useMatchSummary` hook owns async fetch state. Pure formatter helpers (`matchSummaryHelpers.ts`) keep display logic testable. Only `status === 'finished'` match cards get the tap affordance — scheduled/postponed cards are unaffected.

**Tech Stack:** React 19, TypeScript, CSS Modules, Vitest (pure-function tests only — no DOM testing library installed)

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `web/src/widgets/fixtures/types.ts` | Add `MatchEvent`, `MatchStat`, `MatchSummary`, `MatchSummaryUnavailable`, `MatchSummaryResult` types |
| Modify | `web/src/widgets/fixtures/api.ts` | Add `fetchMatchSummary(fixtureId)` |
| Create | `web/src/widgets/fixtures/matchSummaryHelpers.ts` | Pure: `eventIcon`, `eventLabel`, `formatMinute`, `statBarWidths` |
| Create | `web/src/widgets/fixtures/matchSummaryHelpers.test.ts` | Unit tests for all four helpers |
| Create | `web/src/widgets/fixtures/useMatchSummary.ts` | React hook wrapping fetch + state machine |
| Modify | `web/src/widgets/fixtures/fixtures.module.css` | Add drawer overlay, panel, event-row, and stat-bar styles |
| Create | `web/src/widgets/fixtures/MatchSummaryDrawer.tsx` | Slide-up drawer rendering header/events/stats |
| Modify | `web/src/widgets/fixtures/MatchCard.tsx` | Add optional `onSelect` prop; show 📊 affordance on finished cards |
| Modify | `web/src/widgets/fixtures/DayWiseFixturesList.tsx` | Own `selectedFixture` state; render drawer; pass `onSelect` to finished cards |

---

## Task 1: Extend shared types

**Files:**
- Modify: `web/src/widgets/fixtures/types.ts`

- [ ] **Step 1: Add match-summary types after the existing `Fixture` interface**

Replace the entire file with:

```typescript
export type FixtureStatus = 'scheduled' | 'finished' | 'postponed';

export interface TeamSummary {
  id: number;
  name: string;
}

export interface VenueSummary {
  id: number;
  name: string;
}

export interface Fixture {
  id: number;
  match_number: number | null;
  match_date_time: string;
  stage_id: number;
  home_team: TeamSummary;
  away_team: TeamSummary;
  venue: VenueSummary;
  status: FixtureStatus;
  home_score: number | null;
  away_score: number | null;
}

export type MatchEventType =
  | 'goal'
  | 'own_goal'
  | 'penalty_goal'
  | 'penalty_miss'
  | 'yellow_card'
  | 'red_card';

export interface MatchEvent {
  type: MatchEventType;
  minute: number | null;
  team_id: number | null;
  player_name: string | null;
  assist_name: string | null;
  is_extra_time: boolean;
}

export interface MatchStat {
  team_id: number;
  possession_pct: number | null;
  shots: number | null;
  shots_on_target: number | null;
  corners: number | null;
  fouls: number | null;
  yellow_cards: number | null;
  red_cards: number | null;
  offsides: number | null;
  saves: number | null;
}

export interface MatchSummary {
  fixture_id: number;
  available: true;
  events: MatchEvent[];
  stats: MatchStat[];
}

export interface MatchSummaryUnavailable {
  fixture_id: number;
  available: false;
}

export type MatchSummaryResult = MatchSummary | MatchSummaryUnavailable;
```

- [ ] **Step 2: Verify TypeScript compiles with no errors**

```bash
cd web && npx tsc --noEmit
```

Expected: no output (zero errors).

- [ ] **Step 3: Commit**

```bash
git add web/src/widgets/fixtures/types.ts
git commit -m "feat(web): add MatchEvent/MatchStat/MatchSummary types"
```

---

## Task 2: Add `fetchMatchSummary` to the API layer

**Files:**
- Modify: `web/src/widgets/fixtures/api.ts`

- [ ] **Step 1: Add the new function**

Replace the entire file:

```typescript
import type { Fixture, MatchSummaryResult } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '';

export async function fetchFixtures(refresh = false): Promise<Fixture[]> {
  const path = refresh ? '/api/fixtures?refresh=true' : '/api/fixtures';
  const url = API_BASE_URL ? `${API_BASE_URL}${path}` : path;

  const response = await fetch(url);

  if (response.status === 429) {
    throw new Error('Too many requests — please wait a moment and try again.');
  }

  if (!response.ok) {
    throw new Error('Unable to load fixtures');
  }

  return response.json() as Promise<Fixture[]>;
}

export async function fetchMatchSummary(fixtureId: number): Promise<MatchSummaryResult> {
  const path = `/api/fixtures/${fixtureId}/summary`;
  const url = API_BASE_URL ? `${API_BASE_URL}${path}` : path;

  const response = await fetch(url);

  if (response.status === 429) {
    throw new Error('Too many requests — please wait a moment and try again.');
  }

  if (!response.ok) {
    throw new Error('Unable to load match summary');
  }

  return response.json() as Promise<MatchSummaryResult>;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd web && npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add web/src/widgets/fixtures/api.ts
git commit -m "feat(web): add fetchMatchSummary API call"
```

---

## Task 3: Pure display helpers + tests

**Files:**
- Create: `web/src/widgets/fixtures/matchSummaryHelpers.ts`
- Create: `web/src/widgets/fixtures/matchSummaryHelpers.test.ts`

- [ ] **Step 1: Write the failing tests first**

Create `web/src/widgets/fixtures/matchSummaryHelpers.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import {
  eventIcon,
  eventLabel,
  formatMinute,
  statBarWidths,
} from './matchSummaryHelpers';

describe('eventIcon', () => {
  it('returns ⚽ for goal', () => {
    expect(eventIcon('goal')).toBe('⚽');
  });
  it('returns ⚽ for own_goal', () => {
    expect(eventIcon('own_goal')).toBe('⚽');
  });
  it('returns ⚽ for penalty_goal', () => {
    expect(eventIcon('penalty_goal')).toBe('⚽');
  });
  it('returns ❌ for penalty_miss', () => {
    expect(eventIcon('penalty_miss')).toBe('❌');
  });
  it('returns 🟨 for yellow_card', () => {
    expect(eventIcon('yellow_card')).toBe('🟨');
  });
  it('returns 🟥 for red_card', () => {
    expect(eventIcon('red_card')).toBe('🟥');
  });
});

describe('eventLabel', () => {
  it('returns "Goal" for goal', () => {
    expect(eventLabel('goal')).toBe('Goal');
  });
  it('returns "Own Goal" for own_goal', () => {
    expect(eventLabel('own_goal')).toBe('Own Goal');
  });
  it('returns "Penalty" for penalty_goal', () => {
    expect(eventLabel('penalty_goal')).toBe('Penalty');
  });
  it('returns "Penalty Miss" for penalty_miss', () => {
    expect(eventLabel('penalty_miss')).toBe('Penalty Miss');
  });
  it('returns "Yellow Card" for yellow_card', () => {
    expect(eventLabel('yellow_card')).toBe('Yellow Card');
  });
  it('returns "Red Card" for red_card', () => {
    expect(eventLabel('red_card')).toBe('Red Card');
  });
});

describe('formatMinute', () => {
  it("returns \"23'\" for minute 23 not in extra time", () => {
    expect(formatMinute(23, false)).toBe("23'");
  });
  it("returns \"45+'\" for minute 45 in extra time", () => {
    expect(formatMinute(45, true)).toBe("45+'");
  });
  it("returns \"?'\" when minute is null", () => {
    expect(formatMinute(null, false)).toBe("?'");
  });
  it("returns \"?'\" when minute is null even in extra time", () => {
    expect(formatMinute(null, true)).toBe("?'");
  });
});

describe('statBarWidths', () => {
  it('returns 50/50 when both values are null', () => {
    expect(statBarWidths(null, null)).toEqual({ homePct: 50, awayPct: 50 });
  });
  it('returns 50/50 when both values are 0', () => {
    expect(statBarWidths(0, 0)).toEqual({ homePct: 50, awayPct: 50 });
  });
  it('computes correct 60/40 split', () => {
    expect(statBarWidths(60, 40)).toEqual({ homePct: 60, awayPct: 40 });
  });
  it('handles 100/0 when away is 0', () => {
    expect(statBarWidths(10, 0)).toEqual({ homePct: 100, awayPct: 0 });
  });
  it('handles 0/100 when home is 0', () => {
    expect(statBarWidths(0, 5)).toEqual({ homePct: 0, awayPct: 100 });
  });
  it('rounds to nearest integer (25/75)', () => {
    expect(statBarWidths(1, 3)).toEqual({ homePct: 25, awayPct: 75 });
  });
  it('treats null as 0 (home null, away has value)', () => {
    expect(statBarWidths(null, 8)).toEqual({ homePct: 0, awayPct: 100 });
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd web && npm test -- --reporter=verbose 2>&1 | grep -E "matchSummaryHelpers|PASS|FAIL"
```

Expected: `FAIL ... matchSummaryHelpers.test.ts` with "Cannot find module './matchSummaryHelpers'".

- [ ] **Step 3: Implement `matchSummaryHelpers.ts`**

Create `web/src/widgets/fixtures/matchSummaryHelpers.ts`:

```typescript
import type { MatchEventType } from './types';

export function eventIcon(type: MatchEventType): string {
  switch (type) {
    case 'goal':
    case 'own_goal':
    case 'penalty_goal':
      return '⚽';
    case 'penalty_miss':
      return '❌';
    case 'yellow_card':
      return '🟨';
    case 'red_card':
      return '🟥';
  }
}

export function eventLabel(type: MatchEventType): string {
  switch (type) {
    case 'goal':
      return 'Goal';
    case 'own_goal':
      return 'Own Goal';
    case 'penalty_goal':
      return 'Penalty';
    case 'penalty_miss':
      return 'Penalty Miss';
    case 'yellow_card':
      return 'Yellow Card';
    case 'red_card':
      return 'Red Card';
  }
}

export function formatMinute(minute: number | null, isExtraTime: boolean): string {
  if (minute === null) return "?'";
  return isExtraTime ? `${minute}+'` : `${minute}'`;
}

/**
 * Returns 0–100 integer percentage widths for a dual-team comparison bar.
 * Null values are treated as 0. When both sides are 0, returns a 50/50 split
 * so the bar never renders as completely empty.
 */
export function statBarWidths(
  homeVal: number | null,
  awayVal: number | null,
): { homePct: number; awayPct: number } {
  const h = homeVal ?? 0;
  const a = awayVal ?? 0;
  const total = h + a;
  if (total === 0) return { homePct: 50, awayPct: 50 };
  return {
    homePct: Math.round((h / total) * 100),
    awayPct: Math.round((a / total) * 100),
  };
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd web && npm test -- --reporter=verbose 2>&1 | grep -E "matchSummaryHelpers|✓|×"
```

Expected: all 17 tests pass.

- [ ] **Step 5: Commit**

```bash
git add web/src/widgets/fixtures/matchSummaryHelpers.ts \
        web/src/widgets/fixtures/matchSummaryHelpers.test.ts
git commit -m "feat(web): add matchSummaryHelpers with eventIcon/eventLabel/formatMinute/statBarWidths"
```

---

## Task 4: `useMatchSummary` hook

**Files:**
- Create: `web/src/widgets/fixtures/useMatchSummary.ts`

- [ ] **Step 1: Create the hook**

Create `web/src/widgets/fixtures/useMatchSummary.ts`:

```typescript
import { useCallback, useState } from 'react';
import { fetchMatchSummary } from './api';
import type { MatchSummaryResult } from './types';

export type SummaryStatus = 'idle' | 'loading' | 'ready' | 'error';

interface UseMatchSummaryResult {
  summary: MatchSummaryResult | null;
  status: SummaryStatus;
  load: (fixtureId: number) => Promise<void>;
  reset: () => void;
}

export function useMatchSummary(): UseMatchSummaryResult {
  const [summary, setSummary] = useState<MatchSummaryResult | null>(null);
  const [status, setStatus] = useState<SummaryStatus>('idle');

  const load = useCallback(async (fixtureId: number) => {
    setStatus('loading');
    setSummary(null);
    try {
      const data = await fetchMatchSummary(fixtureId);
      setSummary(data);
      setStatus('ready');
    } catch {
      setSummary(null);
      setStatus('error');
    }
  }, []);

  const reset = useCallback(() => {
    setSummary(null);
    setStatus('idle');
  }, []);

  return { summary, status, load, reset };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd web && npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add web/src/widgets/fixtures/useMatchSummary.ts
git commit -m "feat(web): add useMatchSummary hook"
```

---

## Task 5: Drawer CSS

**Files:**
- Modify: `web/src/widgets/fixtures/fixtures.module.css`

- [ ] **Step 1: Append drawer styles to the end of `fixtures.module.css`**

Append the following block (do not remove any existing rules):

```css
/* ─── Match Summary Drawer ─────────────────────────────────────────────── */

.drawerBackdrop {
  position: fixed;
  inset: 0;
  background: rgba(10, 22, 40, 0.45);
  z-index: 299;
  animation: fadeIn 0.2s ease forwards;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.drawerPanel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 300;
  max-height: 82vh;
  background: var(--wc-white);
  border-radius: 20px 20px 0 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  box-shadow: 0 -8px 40px rgba(10, 22, 40, 0.18);
  animation: slideUp 0.28s cubic-bezier(0.32, 0.72, 0, 1) forwards;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}

.drawerHandle {
  display: flex;
  justify-content: center;
  padding: 0.75rem 0 0.25rem;
}

.drawerHandleBar {
  width: 2.5rem;
  height: 4px;
  border-radius: 999px;
  background: var(--wc-border);
}

.drawerHeader {
  padding: 0.75rem 1rem 1rem;
  border-bottom: 1px solid var(--wc-border);
}

.drawerTeamRow {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 0.5rem;
}

.drawerTeamName {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--wc-navy);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.drawerTeamNameAway {
  text-align: right;
}

.drawerScore {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 3.25rem;
  padding: 0.3rem 0.55rem;
  border-radius: 999px;
  background: var(--wc-green);
  color: var(--wc-white);
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  flex-shrink: 0;
}

.drawerSection {
  padding: 1rem 1rem 0.5rem;
}

.drawerSection + .drawerSection {
  border-top: 1px dashed var(--wc-border);
}

.drawerSectionTitle {
  margin: 0 0 0.75rem;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--wc-muted);
}

/* ─── Event timeline ────────────────────────────────────────────────────── */

.eventList {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.eventRow {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.eventRowAway {
  flex-direction: row-reverse;
}

.eventMinute {
  flex-shrink: 0;
  width: 2.5rem;
  font-size: 0.78rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--wc-muted);
  padding-top: 0.1rem;
  text-align: right;
}

.eventRowAway .eventMinute {
  text-align: left;
}

.eventIcon {
  flex-shrink: 0;
  font-size: 0.95rem;
  line-height: 1.4;
}

.eventDetail {
  flex: 1;
  min-width: 0;
}

.eventPlayer {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--wc-navy);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.eventRowAway .eventDetail {
  text-align: right;
}

.eventMeta {
  font-size: 0.75rem;
  color: var(--wc-muted);
}

/* ─── Stat comparison bars ──────────────────────────────────────────────── */

.statList {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  padding-bottom: 0.5rem;
}

.statRow {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.statLabel {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--wc-muted);
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.statBarWrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.statValue {
  width: 2.25rem;
  font-size: 0.85rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.statValueHome {
  text-align: right;
  color: var(--wc-green);
}

.statValueAway {
  text-align: left;
  color: var(--wc-navy);
}

.statBarTrack {
  flex: 1;
  height: 8px;
  border-radius: 999px;
  background: var(--wc-border);
  overflow: hidden;
  display: flex;
}

.statBarHome {
  height: 100%;
  background: var(--wc-green);
  border-radius: 999px 0 0 999px;
  transition: width 0.35s ease;
}

.statBarAway {
  height: 100%;
  background: var(--wc-navy);
  border-radius: 0 999px 999px 0;
  transition: width 0.35s ease;
}

/* ─── Loading / states ──────────────────────────────────────────────────── */

.drawerLoadingWrap {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.25rem 1rem 1.5rem;
}

.drawerSkeletonLine {
  height: 12px;
  border-radius: 999px;
  background: linear-gradient(90deg, #dce8df 25%, #f0f7f2 50%, #dce8df 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

.drawerErrorWrap {
  padding: 1.5rem 1rem 2rem;
  text-align: center;
  color: var(--wc-muted);
  font-size: 0.9rem;
}

.drawerUnavailableWrap {
  padding: 1.5rem 1rem 2rem;
  text-align: center;
}

.drawerUnavailableIcon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.drawerUnavailableText {
  color: var(--wc-muted);
  font-size: 0.9rem;
  line-height: 1.5;
}

/* ─── Card affordance ───────────────────────────────────────────────────── */

.matchCardClickable {
  cursor: pointer;
}

.matchCardClickable:focus-visible {
  outline: 2px solid var(--wc-green);
  outline-offset: 2px;
}

.summaryHint {
  margin-left: auto;
  font-size: 0.8rem;
  opacity: 0.65;
  flex-shrink: 0;
}
```

- [ ] **Step 2: Verify build still works**

```bash
cd web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add web/src/widgets/fixtures/fixtures.module.css
git commit -m "feat(web): add match summary drawer CSS"
```

---

## Task 6: `MatchSummaryDrawer` component

**Files:**
- Create: `web/src/widgets/fixtures/MatchSummaryDrawer.tsx`

- [ ] **Step 1: Create the component**

Create `web/src/widgets/fixtures/MatchSummaryDrawer.tsx`:

```tsx
import { useEffect } from 'react';
import {
  eventIcon,
  eventLabel,
  formatMinute,
  statBarWidths,
} from './matchSummaryHelpers';
import styles from './fixtures.module.css';
import type { Fixture, MatchStat, MatchSummaryResult } from './types';
import type { SummaryStatus } from './useMatchSummary';

interface MatchSummaryDrawerProps {
  fixture: Fixture;
  summary: MatchSummaryResult | null;
  status: SummaryStatus;
  onClose: () => void;
}

interface StatRowDef {
  key: keyof MatchStat;
  label: string;
}

const STAT_ROWS: StatRowDef[] = [
  { key: 'possession_pct', label: 'Possession %' },
  { key: 'shots', label: 'Shots' },
  { key: 'shots_on_target', label: 'On Target' },
  { key: 'corners', label: 'Corners' },
  { key: 'fouls', label: 'Fouls' },
  { key: 'yellow_cards', label: 'Yellows' },
  { key: 'red_cards', label: 'Reds' },
  { key: 'offsides', label: 'Offsides' },
  { key: 'saves', label: 'Saves' },
];

export function MatchSummaryDrawer({
  fixture,
  summary,
  status,
  onClose,
}: MatchSummaryDrawerProps) {
  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const score =
    fixture.home_score !== null && fixture.away_score !== null
      ? `${fixture.home_score} – ${fixture.away_score}`
      : null;

  const homeStat =
    summary?.available
      ? (summary.stats.find((s) => s.team_id === fixture.home_team.id) ?? null)
      : null;
  const awayStat =
    summary?.available
      ? (summary.stats.find((s) => s.team_id === fixture.away_team.id) ?? null)
      : null;

  const hasStats = homeStat !== null || awayStat !== null;
  const hasEvents = summary?.available && summary.events.length > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className={styles.drawerBackdrop}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-up panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Match summary: ${fixture.home_team.name} vs ${fixture.away_team.name}`}
        className={styles.drawerPanel}
      >
        {/* Drag handle */}
        <div className={styles.drawerHandle} aria-hidden="true">
          <div className={styles.drawerHandleBar} />
        </div>

        {/* Header — teams + final score */}
        <div className={styles.drawerHeader}>
          <div className={styles.drawerTeamRow}>
            <span className={styles.drawerTeamName}>
              {fixture.home_team.name}
            </span>
            <span className={styles.drawerScore}>
              {score ?? '— —'}
            </span>
            <span className={`${styles.drawerTeamName} ${styles.drawerTeamNameAway}`}>
              {fixture.away_team.name}
            </span>
          </div>
        </div>

        {/* Loading skeleton */}
        {status === 'loading' && (
          <div className={styles.drawerLoadingWrap}>
            {[80, 60, 90, 50, 75].map((w) => (
              <div
                key={w}
                className={styles.drawerSkeletonLine}
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className={styles.drawerErrorWrap}>
            ⚠️ Could not load match summary. Please try again.
          </div>
        )}

        {/* Summary not available (match not finished on ESPN side) */}
        {status === 'ready' && summary && !summary.available && (
          <div className={styles.drawerUnavailableWrap}>
            <div className={styles.drawerUnavailableIcon}>📋</div>
            <p className={styles.drawerUnavailableText}>
              Match summary is not available yet.
              <br />
              Check back after the match ends.
            </p>
          </div>
        )}

        {/* Events timeline */}
        {status === 'ready' && hasEvents && summary?.available && (
          <div className={styles.drawerSection}>
            <p className={styles.drawerSectionTitle}>Match Events</p>
            <div className={styles.eventList}>
              {summary.events.map((event, i) => {
                const isAway = event.team_id === fixture.away_team.id;
                const metaParts: string[] = [];
                if (event.type !== 'goal' && event.type !== 'penalty_goal') {
                  metaParts.push(eventLabel(event.type));
                }
                if (event.assist_name) {
                  metaParts.push(`assist: ${event.assist_name}`);
                }
                if (event.type === 'own_goal') {
                  metaParts.push('OG');
                }

                return (
                  <div
                    key={i}
                    className={`${styles.eventRow} ${isAway ? styles.eventRowAway : ''}`}
                  >
                    <span className={styles.eventMinute}>
                      {formatMinute(event.minute, event.is_extra_time)}
                    </span>
                    <span className={styles.eventIcon} aria-hidden="true">
                      {eventIcon(event.type)}
                    </span>
                    <div className={styles.eventDetail}>
                      <div className={styles.eventPlayer}>
                        {event.player_name ?? '—'}
                      </div>
                      {metaParts.length > 0 && (
                        <div className={styles.eventMeta}>
                          {metaParts.join(' · ')}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stats comparison */}
        {status === 'ready' && hasStats && (
          <div className={styles.drawerSection}>
            <p className={styles.drawerSectionTitle}>Team Stats</p>
            <div className={styles.statList}>
              {STAT_ROWS.map(({ key, label }) => {
                const homeVal = homeStat ? (homeStat[key] as number | null) : null;
                const awayVal = awayStat ? (awayStat[key] as number | null) : null;

                // Skip row when both sides have no data
                if (homeVal === null && awayVal === null) return null;

                const { homePct, awayPct } = statBarWidths(homeVal, awayVal);

                return (
                  <div key={key} className={styles.statRow}>
                    <span className={styles.statLabel}>{label}</span>
                    <div className={styles.statBarWrap}>
                      <span className={`${styles.statValue} ${styles.statValueHome}`}>
                        {homeVal ?? '—'}
                      </span>
                      <div className={styles.statBarTrack}>
                        <div
                          className={styles.statBarHome}
                          style={{ width: `${homePct}%` }}
                        />
                        <div
                          className={styles.statBarAway}
                          style={{ width: `${awayPct}%` }}
                        />
                      </div>
                      <span className={`${styles.statValue} ${styles.statValueAway}`}>
                        {awayVal ?? '—'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom safe-area padding for notched phones */}
        <div style={{ height: 'env(safe-area-inset-bottom, 1.5rem)' }} />
      </div>
    </>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd web && npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add web/src/widgets/fixtures/MatchSummaryDrawer.tsx
git commit -m "feat(web): add MatchSummaryDrawer component"
```

---

## Task 7: Make `MatchCard` tappable for finished matches

**Files:**
- Modify: `web/src/widgets/fixtures/MatchCard.tsx`

- [ ] **Step 1: Update the component**

Replace the entire file:

```tsx
import { TeamWithFlag } from './TeamWithFlag';
import { formatKickoffTime } from './groupByDay';
import { formatStageLabel } from './stageLabels';
import styles from './fixtures.module.css';
import type { Fixture } from './types';

interface MatchCardProps {
  fixture: Fixture;
  followedTeams?: number[];
  id?: string;
  onSelect?: () => void;
}

function isFollowedMatch(fixture: Fixture, followedTeamIds: number[]): boolean {
  return (
    followedTeamIds.includes(fixture.home_team.id) ||
    followedTeamIds.includes(fixture.away_team.id)
  );
}

function formatScore(fixture: Fixture): string | null {
  if (fixture.status !== 'finished') return null;
  if (fixture.home_score === null || fixture.away_score === null) return null;
  return `${fixture.home_score} – ${fixture.away_score}`;
}

export function MatchCard({ fixture, followedTeams = [], id, onSelect }: MatchCardProps) {
  const isFollowed = isFollowedMatch(fixture, followedTeams);
  const scoreLine = formatScore(fixture);
  const isClickable = onSelect !== undefined;

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect?.();
    }
  }

  return (
    <article
      id={id}
      className={[
        styles.matchCard,
        isFollowed ? styles.matchCardFollowed : '',
        isClickable ? styles.matchCardClickable : '',
      ].join(' ')}
      onClick={isClickable ? onSelect : undefined}
      onKeyDown={isClickable ? handleKeyDown : undefined}
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? 'button' : undefined}
      aria-label={
        isClickable
          ? `View match summary for ${fixture.home_team.name} vs ${fixture.away_team.name}`
          : undefined
      }
    >
      <div className={styles.matchMeta}>
        <span className={styles.matchNumber}>
          Match {fixture.match_number ?? '—'}
        </span>
        <span className={styles.kickoffPill}>
          <span className={styles.kickoffIcon} aria-hidden="true">
            ⏱
          </span>
          {formatKickoffTime(fixture.match_date_time)}
        </span>
      </div>
      <div className={styles.teams}>
        <TeamWithFlag name={fixture.home_team.name} align="left" />
        {scoreLine ? (
          <span className={styles.scoreBadge} aria-label={`Final score ${scoreLine}`}>
            {scoreLine}
          </span>
        ) : (
          <span className={styles.vsBadge} aria-label="versus">
            ⚽
          </span>
        )}
        <TeamWithFlag name={fixture.away_team.name} align="right" />
      </div>
      <div className={styles.cardFooter}>
        <span className={styles.stageBadge}>
          {formatStageLabel(fixture.stage_id)}
        </span>
        <span className={styles.venue}>
          <span className={styles.venueIcon} aria-hidden="true">
            📍
          </span>
          {fixture.venue.name}
        </span>
        {isClickable && (
          <span className={styles.summaryHint} aria-hidden="true">
            📊
          </span>
        )}
      </div>
    </article>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles and all existing tests still pass**

```bash
cd web && npx tsc --noEmit && npm test
```

Expected: zero TS errors, all tests green.

- [ ] **Step 3: Commit**

```bash
git add web/src/widgets/fixtures/MatchCard.tsx
git commit -m "feat(web): add onSelect prop to MatchCard for finished-match tap affordance"
```

---

## Task 8: Wire up the drawer in `DayWiseFixturesList`

**Files:**
- Modify: `web/src/widgets/fixtures/DayWiseFixturesList.tsx`

- [ ] **Step 1: Update the component**

Replace the entire file:

```tsx
import { useEffect, useRef, useState } from 'react';
import { getFollowedTeamIds } from '../../features/settings/preferences';
import {
  findNearestUpcomingFixture,
  fixtureElementId,
} from './findNearestUpcomingFixture';
import { MatchCard } from './MatchCard';
import { MatchSummaryDrawer } from './MatchSummaryDrawer';
import { groupFixturesByDay } from './groupByDay';
import { useMatchSummary } from './useMatchSummary';
import styles from './fixtures.module.css';
import type { Fixture } from './types';

interface DayWiseFixturesListProps {
  fixtures: Fixture[];
}

export function DayWiseFixturesList({ fixtures }: DayWiseFixturesListProps) {
  const groups = groupFixturesByDay(fixtures);
  const followedTeams = getFollowedTeamIds();
  const hasAutoScrolledRef = useRef(false);
  const scrollTarget = findNearestUpcomingFixture(fixtures);

  const [selectedFixture, setSelectedFixture] = useState<Fixture | null>(null);
  const { summary, status, load, reset } = useMatchSummary();

  useEffect(() => {
    if (hasAutoScrolledRef.current || !scrollTarget) return;

    const element = document.getElementById(fixtureElementId(scrollTarget.id));
    if (!element) return;

    hasAutoScrolledRef.current = true;
    requestAnimationFrame(() => {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, [scrollTarget]);

  function openDrawer(fixture: Fixture) {
    setSelectedFixture(fixture);
    void load(fixture.id);
  }

  function closeDrawer() {
    setSelectedFixture(null);
    reset();
  }

  return (
    <>
      <div className={styles.dayList}>
        {groups.map((group) => (
          <section key={group.dateKey} className={styles.daySection}>
            <div className={styles.dayHeadingRow}>
              <span className={styles.dayDot} aria-hidden="true" />
              <h2 className={styles.dayHeading}>{group.heading}</h2>
            </div>
            <div className={styles.matchList}>
              {group.fixtures.map((fixture) => (
                <MatchCard
                  key={fixture.id}
                  id={fixtureElementId(fixture.id)}
                  fixture={fixture}
                  followedTeams={followedTeams}
                  onSelect={
                    fixture.status === 'finished'
                      ? () => openDrawer(fixture)
                      : undefined
                  }
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {selectedFixture && (
        <MatchSummaryDrawer
          fixture={selectedFixture}
          summary={summary}
          status={status}
          onClose={closeDrawer}
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles and all tests pass**

```bash
cd web && npx tsc --noEmit && npm test
```

Expected: zero TS errors, all tests green.

- [ ] **Step 3: Commit**

```bash
git add web/src/widgets/fixtures/DayWiseFixturesList.tsx
git commit -m "feat(web): wire MatchSummaryDrawer into DayWiseFixturesList"
```

---

## Self-Review

### Spec coverage check

| Requirement | Covered by |
|---|---|
| Tap finished MatchCard → open drawer | Task 7 (`onSelect` prop) + Task 8 (click handler) |
| Only finished matches are tappable | Task 8: `onSelect` only passed when `fixture.status === 'finished'` |
| Fetch `GET /api/fixtures/:id/summary` | Task 2 (`fetchMatchSummary`) + Task 4 (`useMatchSummary.load`) |
| Loading state while fetching | Task 6: skeleton rendered when `status === 'loading'` |
| Handle ESPN summary unavailable | Task 6: "not available yet" state for `available: false` |
| Handle network error | Task 4: `catch` sets status `'error'`; Task 6 renders error message |
| Events timeline (minute, icon, player) | Task 6: `eventList` with `eventIcon` + `formatMinute` |
| Home events left, away events right | Task 6: `eventRowAway` class flips `flex-direction: row-reverse` |
| Assist shown for goals | Task 6: `metaParts` appends `assist_name` |
| Dual comparison stat bars | Task 6: `statBarHome`/`statBarAway` with inline `width: ${pct}%` |
| Skip stat rows with all-null data | Task 6: `if (homeVal === null && awayVal === null) return null` |
| Press Escape closes drawer | Task 6: `useEffect` keydown listener |
| Tap backdrop closes drawer | Task 6: `onClick={onClose}` on backdrop div |
| Mobile safe-area padding at bottom | Task 6: `env(safe-area-inset-bottom)` spacer |
| Accessible keyboard nav on card | Task 7: `tabIndex`, `role="button"`, `onKeyDown` for Enter/Space |
| `focus-visible` ring on card | Task 5: `.matchCardClickable:focus-visible` CSS rule |
| Pure helpers are unit-tested | Task 3: 17 vitest cases |

### Placeholder scan

No TBD, TODO, "implement later", or stub steps found in this plan.

### Type consistency

- `MatchSummaryResult` defined in Task 1 → used in Task 2 (`fetchMatchSummary` return), Task 4 (`useMatchSummary` state), Task 6 (`MatchSummaryDrawerProps`)
- `SummaryStatus` defined in Task 4 → used in Task 6 (`MatchSummaryDrawerProps`)
- `MatchStat` defined in Task 1 → used in Task 6 (`STAT_ROWS` key type `keyof MatchStat`)
- `eventIcon`/`eventLabel`/`formatMinute`/`statBarWidths` defined in Task 3 → imported in Task 6
- `onSelect?: () => void` defined in Task 7 `MatchCardProps` → passed from Task 8 `DayWiseFixturesList`

All consistent. ✓
