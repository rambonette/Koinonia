import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { IndexeddbPersistence } from 'y-indexeddb';
import { ISyncService } from '../interfaces/ISyncService';

/**
 * WebRTC-based P2P synchronization service with offline persistence
 * Handles peer discovery and real-time data synchronization
 * Uses IndexedDB for offline storage
 * Uses public signaling servers and STUN for NAT traversal
 */
export class WebRTCSyncService implements ISyncService {
  private provider: WebrtcProvider | null = null;
  private persistence: IndexeddbPersistence | null = null;
  private doc: Y.Doc;
  private connected: boolean = false;
  private peerCount: number = 0;
  private connectionCallbacks: Set<(connected: boolean) => void>;
  private peerCallbacks: Set<(count: number) => void>;

  constructor(doc: Y.Doc) {
    this.doc = doc;
    this.connectionCallbacks = new Set();
    this.peerCallbacks = new Set();
  }

  async connect(roomId: string): Promise<void> {
    if (this.provider) {
      console.warn('Already connected, disconnecting first');
      this.disconnect();
    }

    return new Promise((resolve, reject) => {
      try {
        // Initialize IndexedDB persistence first
        // This loads any existing data before connecting to peers
        this.persistence = new IndexeddbPersistence(roomId, this.doc);

        // Wait for IndexedDB to sync before connecting to WebRTC
        this.persistence.whenSynced.then(() => {
          console.log('IndexedDB loaded, connecting to WebRTC...');

          // Now connect to WebRTC peers
          this.provider = new WebrtcProvider(
            roomId,
            this.doc,
            {
              signaling: [
                'wss://signaling.yjs.dev',
                'wss://y-webrtc-signaling-eu.herokuapp.com'
              ],
              peerOpts: {
                config: {
                  iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                  ]
                }
              },
              maxConns: 10,
              filterBcConns: true
            }
          );

          // Listen for connection status
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          this.provider.on('status', (event: any) => {
            this.connected = event.status === 'connected';
            this.connectionCallbacks.forEach(cb => cb(this.connected));
          });

          // Listen for peer changes
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          this.provider.on('peers', (event: any) => {
            this.peerCount = event.webrtcPeers ? event.webrtcPeers.length : 0;
            this.peerCallbacks.forEach(cb => cb(this.peerCount));
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
