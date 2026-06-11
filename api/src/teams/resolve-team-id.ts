import { EspnCompetitor } from '../fixtures/espn.types';
import { isPlaceholderTeam } from './is-placeholder-team';

export const TBD_TEAM_ID = 0;

export function normalizeTeamName(name?: string): string {
  const trimmed = name?.trim();
  if (!trimmed || trimmed.toUpperCase() === 'TBD') {
    return 'TBD';
  }
  return trimmed;
}

export function stableSyntheticTeamId(name: string): number {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) | 0;
  }

  if (hash === 0) {
    return -1;
  }

  return hash > 0 ? -hash : hash;
}

export function resolveEspnTeamId(competitor?: EspnCompetitor): number {
  const name = normalizeTeamName(
    competitor?.team?.displayName ?? competitor?.team?.name,
  );

  if (name === 'TBD') {
    return TBD_TEAM_ID;
  }

  const espnTeamId = competitor?.team?.id;
  if (espnTeamId) {
    const parsed = Number.parseInt(espnTeamId, 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return stableSyntheticTeamId(name);
}

export function buildTeamRecord(
  competitor?: EspnCompetitor,
): Pick<TeamEntityLike, 'id' | 'name' | 'is_placeholder' | 'espn_team_id'> {
  const name = normalizeTeamName(
    competitor?.team?.displayName ?? competitor?.team?.name,
  );
  const id = resolveEspnTeamId(competitor);
  const espnTeamId =
    competitor?.team?.id && id > 0
      ? Number.parseInt(competitor.team.id, 10)
      : null;

  return {
    id,
    name,
    is_placeholder: isPlaceholderTeam(name),
    espn_team_id: Number.isNaN(espnTeamId ?? Number.NaN) ? null : espnTeamId,
  };
}

interface TeamEntityLike {
  id: number;
  name: string;
  is_placeholder: boolean;
  espn_team_id: number | null;
}
