import { EspnVenueSource } from '../fixtures/espn.types';

export const TBD_VENUE_ID = 0;

export function normalizeVenueName(name?: string): string {
  const trimmed = name?.trim();
  if (!trimmed || trimmed.toUpperCase() === 'TBD') {
    return 'TBD';
  }
  return trimmed;
}

export function stableSyntheticVenueId(name: string): number {
  let hash = 17;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) | 0;
  }

  if (hash === 0) {
    return -2;
  }

  return hash > 0 ? -hash : hash;
}

export function resolveVenueId(source?: EspnVenueSource): number {
  const name = normalizeVenueName(source?.fullName);
  if (name === 'TBD') {
    return TBD_VENUE_ID;
  }

  const espnVenueId = source?.id;
  if (espnVenueId) {
    const parsed = Number.parseInt(espnVenueId, 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return stableSyntheticVenueId(name);
}

export function buildVenueRecord(
  source?: EspnVenueSource,
): Pick<VenueEntityLike, 'id' | 'name' | 'city' | 'country' | 'espn_venue_id'> {
  const name = normalizeVenueName(source?.fullName);
  const id = resolveVenueId(source);
  const espnVenueId =
    source?.id && id > 0 ? Number.parseInt(source.id, 10) : null;

  return {
    id,
    name,
    city: source?.address?.city?.trim() || null,
    country: source?.address?.country?.trim() || null,
    espn_venue_id: Number.isNaN(espnVenueId ?? Number.NaN) ? null : espnVenueId,
  };
}

interface VenueEntityLike {
  id: number;
  name: string;
  city: string | null;
  country: string | null;
  espn_venue_id: number | null;
}
