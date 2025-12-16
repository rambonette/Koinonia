import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { IndexeddbPersistence } from 'y-indexeddb';
import { ISyncService } from '../interfaces/ISyncService';
import { ISettingsService } from '../interfaces/ISettingsService';

/**
 * WebRTC-based P2P synchronization service with offline persistence
 * Handles peer discovery and real-time data synchronization
 * Uses IndexedDB for offline storage
 * Uses configurable signaling servers and ICE servers from settings
 */
export class WebRTCSyncService implements ISyncService {
  private provider: WebrtcProvider | null = null;
  private persistence: IndexeddbPersistence | null = null;
  private doc: Y.Doc;
  private settings: ISettingsService;
  private connected: boolean = false;
  private peerCount: number = 0;
  private connectionCallbacks: Set<(connected: boolean) => void>;
  private peerCallbacks: Set<(count: number) => void>;
  private docChangeCallbacks: Set<(doc: Y.Doc) => void>;

  constructor(settings: ISettingsService) {
    this.doc = new Y.Doc();
    this.settings = settings;
    this.connectionCallbacks = new Set();
    this.peerCallbacks = new Set();
    this.docChangeCallbacks = new Set();
  }

  getDoc(): Y.Doc {
    return this.doc;
  }

  onDocChange(callback: (doc: Y.Doc) => void): () => void {
    this.docChangeCallbacks.add(callback);
    return () => this.docChangeCallbacks.delete(callback);
  }

  async connect(roomId: string): Promise<void> {
    if (this.provider) {
      console.warn('Already connected, disconnecting first');
      this.disconnect();
    }

    return new Promise((resolve, reject) => {
      try {
        // Create a fresh Y.Doc for each room to avoid CRDT merge issues
        // Each room needs its own document to prevent items bleeding between rooms
        this.doc = new Y.Doc();
        this.docChangeCallbacks.forEach(cb => cb(this.doc));

        // Initialize IndexedDB persistence first
        // This loads any existing data before connecting to peers
        this.persistence = new IndexeddbPersistence(roomId, this.doc);

        // Wait for IndexedDB to sync before connecting to WebRTC
        this.persistence.whenSynced.then(() => {
          console.log('IndexedDB loaded, connecting to WebRTC...');

          // Get server configuration from settings
          const config = this.settings.getSettings();

          // Now connect to WebRTC peers using configured servers
          this.provider = new WebrtcProvider(
            roomId,
            this.doc,
            {
              signaling: config.signalingServers,
              peerOpts: {
                config: {
                  iceServers: config.iceServers
                }
              },
              maxConns: 20,
              filterBcConns: true
            }
          );

          // Use awareness API for accurate peer tracking
          // Awareness correctly handles disconnections (30s timeout for inactive clients)
          this.provider.awareness.on('change', () => {
            // Guard against callback firing during destroy
            if (!this.provider) return;

            // getStates() returns a Map of all connected clients including self
            // Subtract 1 to exclude self from peer count
            const states = this.provider.awareness.getStates();
            this.peerCount = Math.max(0, states.size - 1);
            this.peerCallbacks.forEach(cb => cb(this.peerCount));
          });

          // Listen for peers event for connection status (signaling server is reachable)
          this.provider.on('peers', () => {
            this.connected = true;
            this.connectionCallbacks.forEach(cb => cb(this.connected));
          });

          // Listen for sync status - indicates successful data synchronization
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          this.provider.on('synced', (event: any) => {
            // When synced event fires, provider is working
            this.connected = event.synced;
            this.connectionCallbacks.forEach(cb => cb(this.connected));
          });

          // Resolve after a short delay to allow initial connection
          setTimeout(() => resolve(), 1000);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.provider) {
      this.provider.destroy();
      this.provider = null;
      this.connected = false;
      this.peerCount = 0;
      this.connectionCallbacks.forEach(cb => cb(false));
      this.peerCallbacks.forEach(cb => cb(0));
    }

    // Destroy IndexedDB persistence
    if (this.persistence) {
      this.persistence.destroy();
      this.persistence = null;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  getPeerCount(): number {
    return this.peerCount;
  }

  onConnectionChange(callback: (connected: boolean) => void): () => void {
    this.connectionCallbacks.add(callback);
    return () => this.connectionCallbacks.delete(callback);
  }

  onPeersChange(callback: (count: number) => void): () => void {
    this.peerCallbacks.add(callback);
    return () => this.peerCallbacks.delete(callback);
  }
}
