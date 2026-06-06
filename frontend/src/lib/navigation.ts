export const NAV_DRAWER_EVENT = 'fsit:navigation-drawer';
export const NAV_FAVORITES_EVENT = 'fsit:navigation-favorites';

export type RecentPage = {
  label: string;
  path: string;
  visitedAt: string;
};

export function navigationStorageKey(userId: string, setting: string) {
  return `fsit.navigation.${userId}.${setting}`;
}

export function readRecentPages(userId: string): RecentPage[] {
  if (typeof window === 'undefined') return [];
  try {
    const value = localStorage.getItem(navigationStorageKey(userId, 'recentPages'));
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
