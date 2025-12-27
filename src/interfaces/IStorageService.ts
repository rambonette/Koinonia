export interface GroceryItem {
  id: string;
  name: string;
  checked: boolean;
  addedAt: number;
  addedBy?: string;
  parentId: string | null;  // null for root items, parent's id for sub-items
  order: number;  // Display order within parent group (lower = earlier)
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
  addItem(item: Omit<GroceryItem, 'id' | 'addedAt' | 'order'>): void;

  /**
   * Toggle the checked state of an item
   */
  toggleItem(itemId: string): void;

  /**
   * Update an item's properties
   */
  updateItem(itemId: string, updates: Partial<Omit<GroceryItem, 'id' | 'addedAt'>>): void;

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

  /**
   * Set the parent of an item (for drag-and-drop hierarchy)
   * @param itemId - The item to move
   * @param parentId - The new parent's id, or null to make root item
   */
  setParent(itemId: string, parentId: string | null): void;

  /**
   * Get all children of a parent item
   */
  getChildren(parentId: string): GroceryItem[];

  /**
   * Reorder an item (and its children) to a new position
   * @param itemId - The item to move
   * @param newOrder - The new order value
   */
  reorderItem(itemId: string, newOrder: number): void;
}
