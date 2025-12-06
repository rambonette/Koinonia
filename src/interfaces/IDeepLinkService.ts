/**
 * Deep link service interface
 * Handles app URL scheme and navigation
 * Follows Single Responsibility Principle
 */
export interface IDeepLinkService {
  /**
   * Initialize deep link listener
   * @param callback - Called when app is opened via deep link
   * @returns Cleanup function
   */
  initialize(callback: (roomId: string) => void): () => void;

  /**
   * Generate a shareable deep link for a room
   */
  generateDeepLink(roomId: string): string;

  /**
   * Extract room ID from a deep link URL
   */
  parseDeepLink(url: string): string | null;
}
