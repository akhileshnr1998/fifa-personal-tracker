import { buildBracketTree, resolveFixtureWinner } from './build-bracket-tree';
import { FixtureResponseDto } from '../fixtures/dto/fixture-response.dto';

function makeFixture(
  overrides: Partial<FixtureResponseDto> & Pick<FixtureResponseDto, 'id'>,
): FixtureResponseDto {
  return {
    match_number: overrides.id,
    match_date_time: '2026-06-29T19:00:00.000Z',
    stage_id: 2,
    home_team: { id: 481, name: 'Germany' },
    away_team: { id: 490, name: 'Paraguay' },
    venue: { id: 1, name: 'Stadium' },
    status: 'scheduled',
    home_score: null,
    away_score: null,
    decided_by: 'regulation',
    home_penalty_score: null,
    away_penalty_score: null,
    ...overrides,
  };
}

describe('resolveFixtureWinner', () => {
  it('uses penalty scores when decided by penalties', () => {
    const fixture = makeFixture({
      id: 760489,
      status: 'finished',
      home_score: 1,
      away_score: 1,
      decided_by: 'penalties',
      home_penalty_score: 3,
      away_penalty_score: 4,
    });

    expect(resolveFixtureWinner(fixture)).toBe(490);
  });
});

describe('buildBracketTree', () => {
  const r32Fixture = makeFixture({
    id: 760489,
    match_number: 73,
    stage_id: 2,
    status: 'finished',
    home_score: 1,
    away_score: 1,
    decided_by: 'penalties',
    home_penalty_score: 3,
    away_penalty_score: 4,
  });

  it('places finished R32 fixture in round 0 and resolves winner', () => {
    const tree = buildBracketTree([r32Fixture]);
    const node = tree.nodes['73'];
    expect(node?.fixture?.home_team.name).toBe('Germany');
    expect(node?.winnerTeamId).toBe(490);
    expect(tree.rounds[0]?.nodes.some((entry) => entry.slot.matchNumber === 73)).toBe(
      true,
    );
  });

  it('creates placeholder nodes for missing knockout slots', () => {
    const tree = buildBracketTree([r32Fixture]);
    expect(tree.nodes['104']?.fixture).toBeNull();
    expect(tree.rounds).toHaveLength(6);
  });

  it('sets knockoutStarted when knockout fixtures exist', () => {
    expect(buildBracketTree([r32Fixture]).knockoutStarted).toBe(true);
    expect(
      buildBracketTree([
        makeFixture({ id: 1, match_number: 1, stage_id: 1 }),
      ]).knockoutStarted,
    ).toBe(false);
  });
});
