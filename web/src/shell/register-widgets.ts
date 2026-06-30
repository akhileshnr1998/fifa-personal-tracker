import { registerWidget } from './registry';

const CURRENT_PHASE = Number(import.meta.env.VITE_APP_PHASE ?? 7);

registerWidget({
  id: 'hub',
  label: 'Hub',
  phase: 2,
  navOrder: 0,
  lazy: () => import('../widgets/hub/HubWidget'),
});

registerWidget({
  id: 'fixtures',
  label: 'Fixtures',
  phase: 1,
  navOrder: 1,
  lazy: () => import('../widgets/fixtures/FixturesWidget'),
});

registerWidget({
  id: 'standings',
  label: 'Standings',
  phase: 6,
  navOrder: 2,
  lazy: () => import('../widgets/standings/StandingsWidget'),
});

registerWidget({
  id: 'teams',
  label: 'Teams',
  phase: 5,
  navOrder: 3,
  lazy: () => import('../widgets/teams/TeamsWidget'),
});

registerWidget({
  id: 'bracket',
  label: 'Bracket',
  phase: 6,
  navOrder: 4,
  lazy: () => import('../widgets/bracket/BracketWidget'),
});

export function getCurrentPhase(): number {
  return CURRENT_PHASE;
}
