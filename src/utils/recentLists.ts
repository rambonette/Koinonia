/**
 * Utility for managing recently accessed lists
 * Stores list metadata in localStorage for quick access
 */

export interface RecentList {
  roomId: string;
  lastAccessed: number;
  itemCount?: number;
}

const STORAGE_KEY = 'koinonia-recent-lists';
const MAX_RECENT = 10;

export const recentListsUtils = {
  /**
   * Add or update a list in recent history
   */
  addRecentList(roomId: string): void {
    const recent = this.getRecentLists();

    // Remove if already exists
    const filtered = recent.filter(item => item.roomId !== roomId);

    // Add to front
    filtered.unshift({
      roomId,
      lastAccessed: Date.now()
    });

    // Keep only MAX_RECENT items
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
