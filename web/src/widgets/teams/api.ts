import type { TeamProfile, TeamSquad } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '';

function buildUrl(path: string): string {
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

export async function fetchTeams(refresh = false): Promise<TeamProfile[]> {
  const path = refresh ? '/api/teams?refresh=true' : '/api/teams';
  const response = await fetch(buildUrl(path));
  if (!response.ok) {
    throw new Error('Unable to load teams');
  }
  return response.json() as Promise<TeamProfile[]>;
}

export async function fetchTeamSquad(
  teamId: number,
  refresh = false,
): Promise<TeamSquad> {
  const path = refresh
    ? `/api/teams/${teamId}/squad?refresh=true`
    : `/api/teams/${teamId}/squad`;
  const response = await fetch(buildUrl(path));
  if (!response.ok) {
    throw new Error('Unable to load squad');
  }
  return response.json() as Promise<TeamSquad>;
}
