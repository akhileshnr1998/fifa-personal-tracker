import type { GroupStandings } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '';

export async function fetchStandings(refresh = false): Promise<GroupStandings[]> {
  const path = refresh ? '/api/standings/groups?refresh=true' : '/api/standings/groups';
  const url = API_BASE_URL ? `${API_BASE_URL}${path}` : path;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Unable to load standings');
  }

  return response.json() as Promise<GroupStandings[]>;
}
