export interface GroceryItem {
  id: string;
  name: string;
  checked: boolean;
  addedAt: number;
  addedBy?: string;
}

/**
 * Storage service interface for grocery list data
 * Abstracts the underlying CRDT or storage mechanism
 * Follows Interface Segregation Principle
 */
export interface IStorageService {
  /**
   * Get all items in the grocery list
   */
  getItems(): GroceryItem[];

  /**
   * Add a new item to the list
   */
  addItem(item: Omit<GroceryItem, 'id' | 'addedAt'>): void;

  /**
   * Toggle the checked state of an item
   */
  toggleItem(itemId: string): void;

  /**
   * Remove an item from the list
   */
  removeItem(itemId: string): void;

  /**
   * Subscribe to item changes
   * @param callback - Called when items change
   * @returns Unsubscribe function
   */
  onChange(callback: (items: GroceryItem[]) => void): () => void;

  /**
   * Clear all items
   */
  clear(): void;
}
