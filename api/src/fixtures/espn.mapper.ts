import { resolveEspnTeamId } from '../teams/resolve-team-id';
import { resolveVenueId } from '../venues/resolve-venue-id';
import { mapDecidedBy } from './decided-by';
import { FixtureEntity } from './entities/fixture.entity';
import { ESPN_STAGE_SLUG_TO_ID, FixtureStatus } from './fixture-status';
import { EspnCompetition, EspnEvent, EspnVenueSource } from './espn.types';

export function getVenueSource(
  event: EspnEvent,
  competition?: EspnCompetition,
): EspnVenueSource | undefined {
  return competition?.venue ?? event.venue;
}

export function getEventKickoff(
  event: EspnEvent,
  competition?: EspnCompetition,
): Date {
  const kickoff =
    competition?.startDate ?? competition?.date ?? event.date ?? '';
  return kickoff ? new Date(kickoff) : new Date();
}

export function mapStageId(stageSlug?: string): number {
  if (!stageSlug) return 0;
  return ESPN_STAGE_SLUG_TO_ID[stageSlug] ?? 0;
}

export function mapFixtureStatus(competition?: EspnCompetition): FixtureStatus {
  const statusType = competition?.status?.type;
  if (!statusType) return 'scheduled';

  const statusName = statusType.name ?? '';
  if (
    statusType.completed === true ||
    statusType.state === 'post' ||
    /FULL_TIME|FINAL/i.test(statusName)
  ) {
    return 'finished';
  }

  if (/POSTPONED|CANCELLED|ABANDONED|SUSPENDED/i.test(statusName)) {
    return 'postponed';
  }

  return 'scheduled';
}

export function parseScore(score?: string): number | null {
  if (score === undefined || score === null || score === '') return null;
  const parsed = Number.parseInt(score, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function mapFixtureScores(
  competition: EspnCompetition | undefined,
  status: FixtureStatus,
): { home: number | null; away: number | null } {
  if (status !== 'finished' || !competition?.competitors) {
    return { home: null, away: null };
  }

  const home = competition.competitors.find((c) => c.homeAway === 'home');
  const away = competition.competitors.find((c) => c.homeAway === 'away');
  return {
    home: parseScore(home?.score),
    away: parseScore(away?.score),
  };
}

/**
 * Maps a single ESPN event to a FixtureEntity ready for upsert.
 * Uses resolveEspnTeamId / resolveVenueId directly (M2) — avoids allocating
 * full team/venue record objects just to extract the ID.
 */
export function mapEspnEvent(event: EspnEvent, matchNumber: number): FixtureEntity {
  const competition = event.competitions?.[0];
  const homeCompetitor = competition?.competitors?.find(
    (c) => c.homeAway === 'home',
  );
  const awayCompetitor = competition?.competitors?.find(
    (c) => c.homeAway === 'away',
  );
  const status = mapFixtureStatus(competition);
  const scores = mapFixtureScores(competition, status);

  const entity = new FixtureEntity();
  entity.id = Number.parseInt(event.id, 10);
  entity.match_number = matchNumber;
  entity.match_date_time = getEventKickoff(event, competition);
  entity.stage_id = mapStageId(event.season?.slug);
  entity.home_team_id = resolveEspnTeamId(homeCompetitor);
  entity.away_team_id = resolveEspnTeamId(awayCompetitor);
  entity.venue_id = resolveVenueId(getVenueSource(event, competition));
  entity.status = status;
  entity.home_score = scores.home;
  entity.away_score = scores.away;

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

  return entity;
}

export function mapEspnEvents(events: EspnEvent[]): FixtureEntity[] {
  const sorted = [...events].sort(
    (a, b) => getEventKickoff(a).getTime() - getEventKickoff(b).getTime(),
  );
  return sorted.map((event, index) => mapEspnEvent(event, index + 1));
}
