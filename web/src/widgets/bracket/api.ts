import type { BracketApiResponse } from './hydrateBracketTree';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '';

export async function fetchBracket(refresh = false): Promise<BracketApiResponse> {
  const path = refresh ? '/api/bracket?refresh=true' : '/api/bracket';
  const url = API_BASE_URL ? `${API_BASE_URL}${path}` : path;

  const response = await fetch(url);

  if (response.status === 429) {
    throw new Error('Too many requests — please wait a moment and try again.');
  }

  if (!response.ok) {
    throw new Error('Unable to load bracket');
  }

  return response.json() as Promise<BracketApiResponse>;
}
