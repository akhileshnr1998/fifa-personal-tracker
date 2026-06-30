import type { HubData } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '';

export async function fetchHub(refresh = false): Promise<HubData> {
  const path = refresh ? '/api/hub?refresh=true' : '/api/hub';
  const url = API_BASE_URL ? `${API_BASE_URL}${path}` : path;

  const response = await fetch(url);

  if (response.status === 429) {
    throw new Error('Too many requests — please wait a moment and try again.');
  }

  if (!response.ok) {
    throw new Error('Unable to load hub');
  }

  return response.json() as Promise<HubData>;
}
