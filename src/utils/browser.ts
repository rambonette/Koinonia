import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

/**
 * Opens a URL in the system browser.
 * Uses Capacitor Browser plugin on native platforms,
 * falls back to window.open on web.
 */
export const openUrl = async (url: string): Promise<void> => {
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url });
  } else {
    window.open(url, '_blank');
  }
};
