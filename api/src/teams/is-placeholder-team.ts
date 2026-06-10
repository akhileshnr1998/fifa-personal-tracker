/**
 * Knockout bracket codes (1A, W74, L101, 3C/E/F/H/I, TBD, etc.) are not
 * followable national teams — exclude them from the Settings team picker.
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

  return /winner|placeholder|to be determined/i.test(value);
}
