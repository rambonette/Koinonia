/**
 * Settings service interface for managing app configuration
 * Stores user preferences for signaling servers and ICE servers
 */

export interface ServerConfig {
  signalingServers: string[];
  iceServers: RTCIceServer[];
}

export interface UpdateSettings {
  checkForStableUpdates: boolean;
  checkForNightlyUpdates: boolean;
}

export interface AppSettings extends ServerConfig, UpdateSettings {
  // Future settings can be added here
}

export interface ISettingsService {
  /**
   * Get current settings
   */
  getSettings(): AppSettings;

  /**
   * Update settings
   */
  updateSettings(settings: Partial<AppSettings>): void;

  /**
   * Reset settings to defaults
   */
  resetToDefaults(): void;

  /**
   * Subscribe to settings changes
   */
  onChange(callback: (settings: AppSettings) => void): () => void;
}
