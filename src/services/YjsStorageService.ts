import * as Y from 'yjs';
import { IStorageService, GroceryItem } from '../interfaces/IStorageService';

/**
 * Yjs-based storage service implementation
 * Uses Y.Array for CRDT-based grocery list storage
 * Ensures conflict-free concurrent editing
 */
export class YjsStorageService implements IStorageService {
  private doc: Y.Doc;
  private items: Y.Array<GroceryItem>;
  private observers: Set<(items: GroceryItem[]) => void>;

  constructor(doc: Y.Doc) {
    this.doc = doc;
    this.items = this.doc.getArray<GroceryItem>('groceryItems');
    this.observers = new Set();

    // Set up observer for changes
    this.items.observe(() => {
      const currentItems = this.getItems();
      this.observers.forEach(callback => callback(currentItems));
    });
  }

  getItems(): GroceryItem[] {
    return this.items.toArray();
  }

  addItem(item: Omit<GroceryItem, 'id' | 'addedAt'>): void {
    const newItem: GroceryItem = {
      ...item,
      id: crypto.randomUUID(),
      addedAt: Date.now(),
    };

    this.items.push([newItem]);
  }

  toggleItem(itemId: string): void {
    const items = this.getItems();
    const index = items.findIndex(item => item.id === itemId);

    if (index === -1) {
      console.warn(`Item ${itemId} not found`);
      return;
    }

    const item = items[index];

    // Yjs requires delete + insert for updates
    // Using transaction ensures atomicity
    this.doc.transact(() => {
      this.items.delete(index, 1);
      this.items.insert(index, [{
        ...item,
        checked: !item.checked
      }]);
    });
  }

  removeItem(itemId: string): void {
    const items = this.getItems();
    const index = items.findIndex(item => item.id === itemId);

    if (index !== -1) {
      this.items.delete(index, 1);
    }
  }

  onChange(callback: (items: GroceryItem[]) => void): () => void {
    this.observers.add(callback);

    // Return unsubscribe function to prevent memory leaks
    return () => {
      this.observers.delete(callback);
    };
  }

  clear(): void {
    this.items.delete(0, this.items.length);
  }
}
