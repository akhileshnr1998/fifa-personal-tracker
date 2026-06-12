import { TEAM_ISO_CODES } from './teamFlagMap';

function normalizeKey(teamName: string): string {
  return teamName
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

export function isPlaceholderTeam(teamName: string): boolean {
  const value = teamName.trim();
  if (!value || value.toUpperCase() === 'TBD') {
    return true;
  }

  if (/^(?:\d[A-L]|W\d+|L\d+)$/i.test(value)) {
    return true;
  }

  if (/^3(?:[A-L]\/?)+$/i.test(value)) {
    return true;
  }

  if (
    /\b(?:2nd Place|3rd Place|Third Place|Semifinal|Quarterfinal|Round of (?:16|32))\b/i.test(
      value,
    )
  ) {
    return true;
  }

  return /winner|placeholder|to be determined/i.test(value);
}

export function getTeamIsoCode(teamName: string): string | null {
  if (isPlaceholderTeam(teamName)) {
    return null;
  }

  return TEAM_ISO_CODES[normalizeKey(teamName)] ?? null;
}

export function getFlagUrl(isoCode: string, width = 40): string {
  return `https://flagcdn.com/w${width}/${isoCode.toLowerCase()}.png`;
}

export function getFlagSrcSet(isoCode: string): string {
  return `${getFlagUrl(isoCode, 40)} 1x, ${getFlagUrl(isoCode, 80)} 2x`;
}
