import { ISettingsService, AppSettings } from '../interfaces/ISettingsService';

const STORAGE_KEY = 'koinonia-settings';

/**
 * Determines if we're in development mode
 * (running on localhost or dev server)
 */
const isDevelopment = (): boolean => {
  if (typeof window === 'undefined') return false;

  const hostname = window.location.hostname;
  return hostname === 'localhost' ||
         hostname === '127.0.0.1' ||
         hostname.startsWith('192.168.') ||
         hostname.startsWith('10.') ||
         import.meta.env.DEV;
};

/**
 * Get default settings based on environment
 */
const getDefaultSettings = (): AppSettings => {
  const devSettings: AppSettings = {
    signalingServers: ['ws://localhost:4444'],
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  const prodSettings: AppSettings = {
    signalingServers: [
      'wss://signaling.yjs.dev',
      'wss://y-webrtc-signaling-eu.herokuapp.com',
      'wss://y-webrtc-signaling-us.herokuapp.com'
    ],
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ]
  };

  return isDevelopment() ? devSettings : prodSettings;
};

/**
 * Settings service implementation using localStorage
 */
export class SettingsService implements ISettingsService {
  private settings: AppSettings;
  private listeners: Set<(settings: AppSettings) => void>;

  constructor() {
    this.listeners = new Set();
    this.settings = this.loadSettings();
  }

  private loadSettings(): AppSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure all fields exist
        return {
          ...getDefaultSettings(),
          ...parsed
        };
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
    return getDefaultSettings();
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.settings));
  }

  getSettings(): AppSettings {
    return { ...this.settings };
  }

  updateSettings(updates: Partial<AppSettings>): void {
    this.settings = {
      ...this.settings,
      ...updates
    };
    this.saveSettings();
  }

  resetToDefaults(): void {
    this.settings = getDefaultSettings();
    this.saveSettings();
  }

  onChange(callback: (settings: AppSettings) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }
}
