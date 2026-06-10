import { registerWidget } from './registry';

const CURRENT_PHASE = 7;

registerWidget({
  id: 'fixtures',
  label: 'Fixtures',
  phase: 1,
  navOrder: 1,
  lazy: () => import('../widgets/fixtures/FixturesWidget'),
});

export function getCurrentPhase(): number {
  return CURRENT_PHASE;
}
