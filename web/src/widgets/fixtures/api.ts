import type { Fixture } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '';

export async function fetchFixtures(refresh = false): Promise<Fixture[]> {
  const path = refresh ? '/api/fixtures?refresh=true' : '/api/fixtures';
  const url = API_BASE_URL ? `${API_BASE_URL}${path}` : path;

  const response = await fetch(url);

  if (response.status === 429) {
    throw new Error('Too many requests — please wait a moment and try again.');
  }

  if (!response.ok) {
    throw new Error('Unable to load fixtures');
  }

  return response.json() as Promise<Fixture[]>;
}
