export type FixtureStatus = 'scheduled' | 'finished' | 'postponed';

export const ESPN_STAGE_SLUG_TO_ID: Record<string, number> = {
  'group-stage': 1,
  'round-of-32': 2,
  'round-of-16': 3,
  quarterfinals: 4,
  semifinals: 5,
  '3rd-place-match': 6,
  final: 7,
};
