import { App, URLOpenListenerEvent } from '@capacitor/app';
import { PluginListenerHandle } from '@capacitor/core';
import { IDeepLinkService } from '../interfaces/IDeepLinkService';

/**
 * Capacitor-based deep link service
 * Handles app URL scheme (koinonia://) for sharing lists
 * Provides cross-platform deep linking support
 */
export class DeepLinkService implements IDeepLinkService {
  private readonly scheme = 'koinonia';
  private listener: PluginListenerHandle | null = null;

  initialize(callback: (roomId: string) => void): () => void {
    // Set up listener asynchronously
    App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      const roomId = this.parseDeepLink(event.url);
      if (roomId) {
        callback(roomId);
      }
    }).then(handle => {
      this.listener = handle;
    });

    // Check for initial launch URL (Cold start)
    App.getLaunchUrl().then(launchUrl => {
      if (launchUrl && launchUrl.url) {
        const roomId = this.parseDeepLink(launchUrl.url);
        if (roomId) {
          callback(roomId);
        }
      }
    });

    return () => {
      if (this.listener) {
        this.listener.remove();
        this.listener = null;
      }
    };
  }

  generateDeepLink(roomId: string): string {
    return `${this.scheme}://list/${roomId}`;
  }

  parseDeepLink(url: string): string | null {
    try {
      const urlObj = new URL(url);

      if (urlObj.protocol !== `${this.scheme}:`) {
        return null;
      }

      // Extract room ID from path
      const pathParts = urlObj.pathname.split('/').filter(Boolean);

      if (pathParts.length > 0 && pathParts[0] === 'list' && pathParts[1]) {
        return pathParts[1];
      }

      return null;
    } catch (error) {
      console.error('Failed to parse deep link:', error);
      return null;
    }
  }
}
