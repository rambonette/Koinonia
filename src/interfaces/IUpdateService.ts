/**
 * Update service interface for checking app updates
 * Checks GitHub releases for stable and nightly versions
 */

export interface ReleaseInfo {
  version: string;
  tagName: string;
  url: string;
  isNightly: boolean;
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  release: ReleaseInfo | null;
}

export interface IUpdateService {
  /**
   * Check for available updates based on settings
   * Returns info about the latest available update, if any
   */
  checkForUpdates(): Promise<UpdateCheckResult>;

  /**
   * Get current app version
   */
  getCurrentVersion(): string;
}
