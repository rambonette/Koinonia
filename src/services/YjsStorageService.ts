import * as Y from 'yjs';
import { IStorageService, GroceryItem } from '../interfaces/IStorageService';
import { ISyncService } from '../interfaces/ISyncService';

/**
 * Yjs-based storage service implementation
 * Uses Y.Array for CRDT-based grocery list storage
 * Ensures conflict-free concurrent editing
 */
export class YjsStorageService implements IStorageService {
  private doc: Y.Doc;
  private items: Y.Array<GroceryItem>;
  private observers: Set<(items: GroceryItem[]) => void>;
  private itemsObserver: () => void;

  constructor(syncService: ISyncService) {
    this.doc = syncService.getDoc();
    this.items = this.doc.getArray<GroceryItem>('groceryItems');
    this.observers = new Set();

    // Set up observer for changes
    this.itemsObserver = () => {
      const currentItems = this.getItems();
      this.observers.forEach(callback => callback(currentItems));
    };
    this.items.observe(this.itemsObserver);

    // Listen for doc changes (when switching rooms)
    syncService.onDocChange((newDoc) => {
      // Unobserve old array
      this.items.unobserve(this.itemsObserver);

      // Rebind to new doc
      this.doc = newDoc;
      this.items = this.doc.getArray<GroceryItem>('groceryItems');
      this.items.observe(this.itemsObserver);

      // Notify observers of the change
      this.observers.forEach(callback => callback(this.getItems()));
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
