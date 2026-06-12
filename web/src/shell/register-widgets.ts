import { registerWidget } from './registry';

const CURRENT_PHASE = Number(import.meta.env.VITE_APP_PHASE ?? 7);

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

export function getCurrentPhase(): number {
  return CURRENT_PHASE;
}
