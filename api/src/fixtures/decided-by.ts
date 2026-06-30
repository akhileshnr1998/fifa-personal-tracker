export type DecidedBy = 'regulation' | 'extra_time' | 'penalties';

const PENALTY_STATUSES = new Set(['STATUS_FINAL_PEN', 'STATUS_AFTER_SHOOTOUT']);
const EXTRA_TIME_STATUSES = new Set(['STATUS_AFTER_EXTRA_TIME']);

export function mapDecidedBy(
  statusName?: string,
  _detail?: string,
): DecidedBy {
  if (!statusName) return 'regulation';
  if (PENALTY_STATUSES.has(statusName)) return 'penalties';
  if (EXTRA_TIME_STATUSES.has(statusName)) return 'extra_time';
  return 'regulation';
}
