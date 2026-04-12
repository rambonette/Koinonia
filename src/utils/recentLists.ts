/**
 * Utility for managing recently accessed lists
 * Stores list metadata in localStorage for quick access
 */

export interface RecentList {
  roomId: string;
  lastAccessed: number;
  name?: string;
  itemCount?: number;
}

const STORAGE_KEY = 'koinonia-recent-lists';
const MAX_RECENT = 10;

export const recentListsUtils = {
  /**
   * Add or update a list in recent history
   */
  addRecentList(roomId: string, name?: string): void {
    const recent = this.getRecentLists();

    // Preserve existing name if not provided
    const existing = recent.find(item => item.roomId === roomId);
    const resolvedName = name ?? existing?.name;

    const filtered = recent.filter(item => item.roomId !== roomId);

    filtered.unshift({
      roomId,
      lastAccessed: Date.now(),
      ...(resolvedName ? { name: resolvedName } : {}),
    });

    const trimmed = filtered.slice(0, MAX_RECENT);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  },

  /**
   * Get all recent lists, sorted by most recent first
   */
  getRecentLists(): RecentList[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Failed to load recent lists:', error);
      return [];
    }
  },

  /**
   * Update the display name of a list
   */
  updateListName(roomId: string, name: string): void {
    const recent = this.getRecentLists();
    const updated = recent.map(item =>
      item.roomId === roomId ? { ...item, name } : item
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  /**
   * Remove a list from recent history
   */
  removeRecentList(roomId: string): void {
    const recent = this.getRecentLists();
    const filtered = recent.filter(item => item.roomId !== roomId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  /**
   * Clear all recent lists
   */
  clearRecentLists(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
};
