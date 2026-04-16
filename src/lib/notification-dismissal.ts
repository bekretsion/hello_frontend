const STORAGE_KEY_PREFIX = 'hello_dismissed_notifications_';

export function dismissNotifications(userId: number | string, ids: string[]) {
  if (!userId || !ids.length) return;
  try {
    const key = `${STORAGE_KEY_PREFIX}${userId}`;
    const existing: string[] = JSON.parse(localStorage.getItem(key) || '[]');
    const merged = Array.from(new Set([...existing, ...ids]));
    localStorage.setItem(key, JSON.stringify(merged));
  } catch {
    // localStorage unavailable — silent fail
  }
}
