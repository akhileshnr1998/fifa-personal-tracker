const USER_ID_KEY = 'wc2026_user_id';

function createUserId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `user-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getUserId(): string {
  const existing = localStorage.getItem(USER_ID_KEY);
  if (existing) {
    return existing;
  }

  const userId = createUserId();
  localStorage.setItem(USER_ID_KEY, userId);
  return userId;
}
