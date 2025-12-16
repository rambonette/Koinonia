import * as Y from 'yjs';

/**
 * Sync service interface following Dependency Inversion Principle
 * Allows swapping implementations (Yjs, Gun, Mock) without changing consumers
 */
export interface ISyncService {
  /**
   * Get the current Yjs document for the connected room
   */
  getDoc(): Y.Doc;

  /**
   * Subscribe to document changes (when switching rooms)
   * @param callback - Called with new doc when room changes
   * @returns Unsubscribe function
   */
  onDocChange(callback: (doc: Y.Doc) => void): () => void;
  /**
   * Connect to a P2P room
   * @param roomId - Unique room identifier
   * @returns Promise that resolves when connection is established
   */
  connect(roomId: string): Promise<void>;

  /**
   * Disconnect from the P2P network
   */
  disconnect(): void;

  /**
   * Check if currently connected to peers
   */
  isConnected(): boolean;

  /**
   * Get number of connected peers
   */
  getPeerCount(): number;

  /**
   * Subscribe to connection status changes
   * @param callback - Called when connection status changes
   * @returns Unsubscribe function
   */
  onConnectionChange(callback: (connected: boolean) => void): () => void;

  /**
   * Subscribe to peer count changes
   * @param callback - Called when peer count changes
   * @returns Unsubscribe function
   */
  onPeersChange(callback: (count: number) => void): () => void;
}
