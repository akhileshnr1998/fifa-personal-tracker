# Knockout Bracket Widget — Product & Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a third nav tab — **Bracket** — alongside Fixtures and Standings, showing a horizontal knockout tree that reveals advancing teams as matches finish.

**Architecture:** Derive the bracket tree client-side from existing `GET /api/fixtures` data plus a static FIFA 2026 topology map keyed by official `match_number`. No new DB tables or ESPN endpoints. Reuse `MatchSummaryDrawer`, refresh context, and compact match nodes.

**Tech Stack:** NestJS (optional thin `/api/bracket` wrapper), React + Vite, CSS Grid/Flex + SVG connectors, existing fixture types.

---

## 1. Product intent

Users in knockout stages need to see **where the tournament is headed**, not just a chronological fixture list. The Bracket tab answers:

- Who plays whom in each round?
- Which path leads to the Final?
- As R32 games finish, who appears in the R16 slots?

This aligns with **Phase 4 (Bracket Widget)** in `docs/fifa_2026_complete_blueprint.md`, accelerated now that knockout play has started.

### Navigation

| Tab | Route | Phase gate |
| :--- | :--- | :--- |
| Fixtures | `/` | 1 |
| Standings | `/standings` | 6 |
| **Bracket** | `/bracket` | **6** (same as standings — knockouts are live) |

Register in `web/src/shell/register-widgets.ts`:

```typescript
registerWidget({
  id: 'bracket',
  label: 'Bracket',
  phase: 6,
  navOrder: 3,
  lazy: () => import('../widgets/bracket/BracketWidget'),
});
```

Header **Refresh** continues to call `GET /api/fixtures?refresh=true`; bracket updates automatically when fixture scores and placeholder names resolve.

---

## 2. UX design — horizontal tree

### Layout (mobile-first)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ← swipe / scroll horizontally →                                            │
│                                                                             │
│  Round of 32    Round of 16    Quarter    Semi      Final                   │
│  ┌─────────┐                                                                │
│  │ GER 1   │──┐                                                             │
│  │ PAR 1(p)│  │    ┌─────────┐                                              │
│  └─────────┘  ├───→│ TBD     │──┐                                           │
│  ┌─────────┐  │    │ TBD     │  │    ┌─────────┐                             │
│  │ ...     │──┘    └─────────┘  ├───→│  ...    │──→ 🏆 Final               │
│  └─────────┘                      │    └─────────┘                          │
│                                   │                                         │
│  (lower half mirrors above)       │    ┌─────────┐                            │
│                                   └───→│ 3rd Pl  │  (parallel branch)       │
│                                        └─────────┘                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Interaction rules**

| Element | Behaviour |
| :--- | :--- |
| Match node | Compact card: flags, team names (truncated), score / kickoff time, stage-agnostic |
| Finished match | Tappable → opens existing `MatchSummaryDrawer` |
| Scheduled match | Not tappable (or tap shows kickoff only — match Fixtures behaviour) |
| Placeholder team | Muted text (`Group E Winner`, `Round of 16 8 Winner`) — same styling as Fixtures |
| Followed team | Purple highlight ring (reuse `matchCardFollowed` pattern) |
| Scroll | Horizontal pan with momentum; optional “Jump to Final” chip pinned bottom-right |
| Empty / pre-knockout | Friendly empty state: *“Knockout bracket appears once Round of 32 begins.”* |

**Accessibility**

- `role="img"` + `aria-label` on connector SVG (decorative, `aria-hidden`)
- Each node is an `<article>` with readable team names
- Round column headers are `<h2>` inside a landmark `region` per round

---

## 3. Architecture options (decision)

### Option A — Static topology + client derivation ✅ Recommended

| | |
| :--- | :--- |
| **How** | `bracketTopology.ts` defines slots (`match_number`, `parentMatchNumbers`, `half: 'upper' \| 'lower'`, `round`). `buildBracketTree(fixtures)` joins live fixture rows. |
| **Pros** | Zero DB migration; zero extra ESPN calls; testable pure function; fits $0 budget |
| **Cons** | One-time codification of FIFA 2026 bracket map (stable for the tournament) |

### Option B — Parse ESPN placeholder strings at sync time

| | |
| :--- | :--- |
| **How** | During sync, regex `"Round of 16 8 Winner"` → parent slot |
| **Pros** | Self-healing if ESPN reorders |
| **Cons** | Fragile labels; still needs slot ordering map; adds sync complexity |

### Option C — New `bracket_slots` DB table + `GET /api/bracket`

| | |
| :--- | :--- |
| **How** | Persist parent/child FKs in Postgres |
| **Pros** | Clean API shape |
| **Cons** | Over-engineered for a fixed 32-match knockout; migration + sync work |

**Decision:** **Option A**. Optionally add a thin `GET /api/bracket` later for Hub widget (Phase 2) — not required for MVP.

---

## 4. Data model

### Existing fields (sufficient)

From `Fixture` / `fixtures` table:

- `match_number` — official FIFA index 1–104 (knockout = **73–104**)
- `stage_id` — 2=R32, 3=R16, 4=QF, 5=SF, 6=3rd, 7=Final
- `home_team` / `away_team` — resolves to real names or placeholders after refresh
- `status`, scores, `decided_by`, penalty scores — already implemented

### Static topology module

**Create:** `web/src/widgets/bracket/bracketTopology.ts` (mirror in `api/` only if server endpoint added later)

```typescript
export interface BracketSlot {
  matchNumber: number;
  stageId: number;
  roundIndex: number;       // 0=R32 … 4=Final
  half: 'upper' | 'lower' | 'third-place';
  row: number;              // vertical position within half (0-based)
  parentMatchNumbers: [number, number] | null;
}

export const KNOCKOUT_MATCH_NUMBERS = [73, 74, /* … */, 104] as const;
export const BRACKET_SLOTS: BracketSlot[] = [ /* 32 entries */ ];
```

**Join logic** (`buildBracketTree.ts`):

1. Index fixtures by `match_number`.
2. For each slot in `BRACKET_SLOTS`, attach fixture or synthesize placeholder node if missing.
3. Compute `winnerTeamId` when `status === 'finished'` (respect penalties via existing score helpers).
4. Return `{ rounds: BracketRound[], nodes: Map<number, BracketNode> }` where each round is an ordered column.

> **Task 0 (research):** Codify parent pairs from the official FIFA 2026 bracket PDF / ESPN schedule. Standard 32-team single elimination: slot *n* in R16 receives winners of R32 slots `2n-1` and `2n`. Verify against live ESPN data for matches 73–88 before merging.

---

## 5. File structure

```
web/src/widgets/bracket/
  BracketWidget.tsx          — loading / empty / stale states; registers refresh handler
  BracketCanvas.tsx          — horizontal scroll container
  BracketRoundColumn.tsx     — one stage column + header
  BracketMatchNode.tsx       — compact match card (reuse TeamWithFlag, formatFixtureScore)
  BracketConnectors.tsx      — SVG lines between parent → child nodes
  buildBracketTree.ts        — pure tree builder
  buildBracketTree.test.ts   — unit tests
  bracketTopology.ts         — static FIFA 2026 slot map
  bracket.module.css         — layout, connectors, scroll
  useBracket.ts              — thin wrapper over useFixtures + buildBracketTree
  types.ts                   — BracketNode, BracketRound

web/src/shell/register-widgets.ts   — add bracket widget
```

**Reuse (no duplication)**

- `TeamWithFlag`, `formatFixtureScore*`, `formatKickoffTime`, `formatStageLabel`
- `MatchSummaryDrawer` + `useMatchSummary` (copy drawer wiring from `DayWiseFixturesList`)
- `FixturesSkeleton` variant or dedicated `BracketSkeleton`
- `FixturesRefreshContext.setRefreshHandler`

---

## 6. Connector rendering

Use **absolute-positioned SVG overlay** inside the scroll container:

1. Each `BracketMatchNode` exposes a ref / `data-slot-id` and measured `{ x, y, width, height }`.
2. After layout (`ResizeObserver` + `requestAnimationFrame`), compute bezier paths from parent bottom-center → child top-center.
3. Lines use `var(--wc-border)` default; `var(--wc-purple)` when a followed team’s path is active (optional v2).

Keep connector math in `computeConnectorPaths.ts` with unit tests for coordinate pairs (no DOM in tests).

---

## 7. Implementation tasks

### Task 1: Bracket topology constant

**Files:**
- Create: `web/src/widgets/bracket/bracketTopology.ts`
- Test: `web/src/widgets/bracket/bracketTopology.test.ts`

- [ ] **Step 1: Write failing test — slot count and stage coverage**

```typescript
import { BRACKET_SLOTS, KNOCKOUT_MATCH_NUMBERS } from './bracketTopology';

it('defines 32 knockout slots spanning R32 through Final', () => {
  expect(KNOCKOUT_MATCH_NUMBERS).toHaveLength(32);
  expect(BRACKET_SLOTS).toHaveLength(32);
  const stages = new Set(BRACKET_SLOTS.map((s) => s.stageId));
  expect(stages).toEqual(new Set([2, 3, 4, 5, 6, 7]));
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `cd web && npm test -- bracketTopology.test.ts -v`

- [ ] **Step 3: Implement topology from FIFA 2026 official bracket**

Populate all 32 `match_number` values (73–104) with correct `parentMatchNumbers` and `half` assignments.

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add web/src/widgets/bracket/bracketTopology.ts web/src/widgets/bracket/bracketTopology.test.ts
git commit -m "feat(bracket): add FIFA 2026 knockout topology map"
```

---

### Task 2: buildBracketTree pure function

**Files:**
- Create: `web/src/widgets/bracket/buildBracketTree.ts`
- Create: `web/src/widgets/bracket/types.ts`
- Test: `web/src/widgets/bracket/buildBracketTree.test.ts`

- [ ] **Step 1: Write failing test — joins fixtures to slots**

```typescript
import { buildBracketTree } from './buildBracketTree';

const r32Fixture = {
  id: 760489,
  match_number: 73,
  stage_id: 2,
  status: 'finished',
  home_team: { id: 481, name: 'Germany' },
  away_team: { id: 490, name: 'Paraguay' },
  home_score: 1,
  away_score: 1,
  decided_by: 'penalties',
  home_penalty_score: 3,
  away_penalty_score: 4,
  /* …remaining Fixture fields… */
};

it('places finished R32 fixture in round 0 and resolves winner', () => {
  const tree = buildBracketTree([r32Fixture]);
  const node = tree.nodes.get(73);
  expect(node?.fixture?.home_team.name).toBe('Germany');
  expect(node?.winnerTeamId).toBe(490);
});
```

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Implement builder**

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit**

---

### Task 3: BracketMatchNode + styles

**Files:**
- Create: `web/src/widgets/bracket/BracketMatchNode.tsx`
- Create: `web/src/widgets/bracket/bracket.module.css`

- [ ] **Step 1: Render compact node with flags, score, pens subline**

Reuse `TeamWithFlag`, `formatFixturePensSubline`, `formatFixtureScoreMeta`.

- [ ] **Step 2: Visual check in dev — node fits ~140px width**

- [ ] **Step 3: Commit**

---

### Task 4: BracketCanvas + round columns + horizontal scroll

**Files:**
- Create: `web/src/widgets/bracket/BracketCanvas.tsx`
- Create: `web/src/widgets/bracket/BracketRoundColumn.tsx`

- [ ] **Step 1: Render 5–6 columns (R32 → Final + 3rd place branch)**

CSS: `display: flex; overflow-x: auto; gap: var(--space-6); scroll-snap-type: x proximity;`

- [ ] **Step 2: Upper/lower halves stacked vertically within canvas**

- [ ] **Step 3: Commit**

---

### Task 5: SVG connectors

**Files:**
- Create: `web/src/widgets/bracket/BracketConnectors.tsx`
- Create: `web/src/widgets/bracket/computeConnectorPaths.ts`
- Test: `web/src/widgets/bracket/computeConnectorPaths.test.ts`

- [ ] **Step 1: Unit test bezier path generation from mock rects**

- [ ] **Step 2: Implement ResizeObserver-based measurement in BracketCanvas**

- [ ] **Step 3: Commit**

---

### Task 6: BracketWidget shell + drawer integration

**Files:**
- Create: `web/src/widgets/bracket/BracketWidget.tsx`
- Create: `web/src/widgets/bracket/useBracket.ts`
- Modify: `web/src/shell/register-widgets.ts`

- [ ] **Step 1: Wire useFixtures → buildBracketTree → BracketCanvas**

- [ ] **Step 2: Register refresh handler via FixturesRefreshContext**

- [ ] **Step 3: MatchSummaryDrawer on finished node tap (mirror DayWiseFixturesList)**

- [ ] **Step 4: Empty / skeleton / stale states**

- [ ] **Step 5: Register widget — verify third tab appears**

Run: `cd web && npm run dev` — confirm `/bracket` route and tab bar.

- [ ] **Step 6: Commit**

---

### Task 7: Blueprint doc update

**Files:**
- Modify: `docs/fifa_2026_complete_blueprint.md` — mark Phase 4 bracket items in progress / complete

- [x] **Step 1: Update Implementation Status Tracker** — Phase 4 bracket items marked code complete in blueprint

- [ ] **Step 2: Commit**

---

## 8. Testing checklist

| Area | Command / action |
| :--- | :--- |
| Unit | `cd web && npm test -- bracket` |
| Manual | Open Bracket tab on mobile viewport — horizontal scroll smooth |
| Manual | Tap finished R32 match → drawer opens with events/stats |
| Manual | Settings → Refresh → placeholder slots resolve to team names |
| Manual | Follow a team in Settings → bracket node highlights |
| Regression | Fixtures and Standings tabs unchanged |

---

## 9. Out of scope (YAGNI)

- Live in-play bracket updates (no polling — refresh only)
- Zoom / pinch gestures
- Hub widget (Phase 2) — shipped without bracket embed; bracket lives on `/bracket` tab
- Separate `GET /api/bracket` endpoint (add only when Hub needs it)
- Group-stage mini-brackets

---

## 10. Risks & mitigations

| Risk | Mitigation |
| :--- | :--- |
| Wrong parent `match_number` map | Cross-check topology against ESPN live schedule before merge; unit test parent pairs |
| Horizontal layout cramped on small phones | Compact nodes (~140px), horizontal scroll, scroll-snap on columns |
| Connector jank on resize | Debounce `ResizeObserver` callbacks |
| Cold start | Reuse `FixturesSkeleton` / stale banner patterns |

---

## 11. Success criteria

1. Third tab **Bracket** visible next to Fixtures and Standings when `VITE_APP_PHASE >= 6`.
2. All 32 knockout matches appear in correct round columns and tree positions.
3. Finished matches show scores; advancing teams visible in downstream slots after Refresh.
4. Tapping a finished match opens the match summary drawer.
5. No new backend migrations or ESPN API calls beyond existing fixture sync.
