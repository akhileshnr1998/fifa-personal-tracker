import { isPlaceholderTeam } from '../fixtures/teamFlags';

/** Short labels for bracket nodes — avoids ellipsis on ESPN placeholders. */
export function abbreviateBracketName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed || trimmed.toUpperCase() === 'TBD') return 'TBD';

  if (!isPlaceholderTeam(trimmed)) {
    return trimmed.length > 14 ? `${trimmed.slice(0, 13)}…` : trimmed;
  }

  const normalized = trimmed.toLowerCase();

  const r32 = normalized.match(/round of 32\s*(\d+)/);
  if (r32) return `R32 W${r32[1]}`;

  const r16 = normalized.match(/round of 16\s*(\d+)/);
  if (r16) return `R16 W${r16[1]}`;

  const qf = normalized.match(/quarter[- ]?final\s*(\d+)/);
  if (qf) return `QF W${qf[1]}`;

  const sf = normalized.match(/semi[- ]?final\s*(\d+)/);
  if (sf) return `SF W${sf[1]}`;

  const group = normalized.match(/group\s+([a-l])\s+winner/);
  if (group) return `Grp ${group[1].toUpperCase()}`;

  if (normalized.includes('third place') || normalized.includes('3rd place')) {
    return '3rd Place';
  }

  if (normalized.includes('winner')) {
    return trimmed.length > 12 ? `${trimmed.slice(0, 11)}…` : trimmed;
  }

  return 'TBD';
}
