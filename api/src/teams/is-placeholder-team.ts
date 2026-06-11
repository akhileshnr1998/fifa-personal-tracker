/**
 * Knockout bracket codes (1A, W74, L101) and ESPN placeholder labels
 * (Group E Winner, Third Place Group A/B/C/D/F, etc.) are not followable
 * national teams — exclude them from the Settings team picker.
 */
export function isPlaceholderTeam(teamName: string): boolean {
  const value = teamName.trim();
  if (!value || value.toUpperCase() === 'TBD') {
    return true;
  }

  if (/^(?:\d[A-L]|W\d+|L\d+)$/i.test(value)) {
    return true;
  }

  if (/^3[A-L](?:\/[A-L])+$/i.test(value)) {
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
