const TEAM_ISO_CODES: Record<string, string> = {
  algeria: 'dz',
  argentina: 'ar',
  australia: 'au',
  austria: 'at',
  belgium: 'be',
  'bosnia & herzegovina': 'ba',
  'bosnia and herzegovina': 'ba',
  'bosnia-herzegovina': 'ba',
  brazil: 'br',
  canada: 'ca',
  'cape verde': 'cv',
  'cabo verde': 'cv',
  colombia: 'co',
  croatia: 'hr',
  curacao: 'cw',
  'czech republic': 'cz',
  czechia: 'cz',
  'dr congo': 'cd',
  'democratic republic of the congo': 'cd',
  'congo dr': 'cd',
  ecuador: 'ec',
  egypt: 'eg',
  england: 'gb-eng',
  france: 'fr',
  germany: 'de',
  ghana: 'gh',
  haiti: 'ht',
  iran: 'ir',
  'ir iran': 'ir',
  iraq: 'iq',
  'ivory coast': 'ci',
  "cote d'ivoire": 'ci',
  "côte d'ivoire": 'ci',
  japan: 'jp',
  jordan: 'jo',
  mexico: 'mx',
  morocco: 'ma',
  netherlands: 'nl',
  'new zealand': 'nz',
  norway: 'no',
  panama: 'pa',
  paraguay: 'py',
  portugal: 'pt',
  qatar: 'qa',
  'saudi arabia': 'sa',
  scotland: 'gb-sct',
  senegal: 'sn',
  'south africa': 'za',
  'south korea': 'kr',
  'korea republic': 'kr',
  spain: 'es',
  sweden: 'se',
  switzerland: 'ch',
  tunisia: 'tn',
  turkey: 'tr',
  turkiye: 'tr',
  uruguay: 'uy',
  usa: 'us',
  'united states': 'us',
  uzbekistan: 'uz',
};

function normalizeKey(teamName: string): string {
  return teamName.trim().toLowerCase();
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
