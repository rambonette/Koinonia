import * as Y from 'yjs';
import { IStorageService, GroceryItem } from '../interfaces/IStorageService';
import { ISyncService } from '../interfaces/ISyncService';

/**
 * Yjs-based storage service implementation
 * Uses Y.Map for each item to enable property-level conflict resolution
 * Concurrent edits to the same property use LWW (last-write-wins)
 */
export class YjsStorageService implements IStorageService {
  private doc: Y.Doc;
  private itemsMap: Y.Map<Y.Map<unknown>>;
  private observers: Set<(items: GroceryItem[]) => void>;
  private itemsObserver: () => void;

  constructor(syncService: ISyncService) {
    this.doc = syncService.getDoc();
    this.itemsMap = this.doc.getMap<Y.Map<unknown>>('groceryItemsV2');
    this.observers = new Set();

    // Set up observer for changes
    this.itemsObserver = () => {
      const currentItems = this.getItems();
      this.observers.forEach(callback => callback(currentItems));
    };
    this.itemsMap.observeDeep(this.itemsObserver);

    // Listen for doc changes (when switching rooms)
    syncService.onDocChange((newDoc) => {
      // Unobserve old map
      this.itemsMap.unobserveDeep(this.itemsObserver);

      // Rebind to new doc
      this.doc = newDoc;
      this.itemsMap = this.doc.getMap<Y.Map<unknown>>('groceryItemsV2');
      this.itemsMap.observeDeep(this.itemsObserver);

      // Notify observers of the change
      this.observers.forEach(callback => callback(this.getItems()));
    });
  }

  private yMapToItem(id: string, yMap: Y.Map<unknown>): GroceryItem {
    return {
      id,
      name: yMap.get('name') as string,
      checked: yMap.get('checked') as boolean,
      addedAt: yMap.get('addedAt') as number,
      addedBy: yMap.get('addedBy') as string | undefined,
    };
  }

  getItems(): GroceryItem[] {
    const items: GroceryItem[] = [];
    this.itemsMap.forEach((yMap, id) => {
      items.push(this.yMapToItem(id, yMap));
    });
    // Sort by checked state (unchecked first), then by addedAt to maintain consistent ordering
    return items.sort((a, b) => {
      if (a.checked === b.checked) {
        return a.addedAt - b.addedAt;
      }
      return a.checked ? 1 : -1;
    });
  }

  addItem(item: Omit<GroceryItem, 'id' | 'addedAt'>): void {
    const id = crypto.randomUUID();
    const yMap = new Y.Map<unknown>();

    this.doc.transact(() => {
      yMap.set('name', item.name);
      yMap.set('checked', item.checked);
      yMap.set('addedAt', Date.now());
      if (item.addedBy) {
        yMap.set('addedBy', item.addedBy);
      }
      this.itemsMap.set(id, yMap);
    });
  }

  toggleItem(itemId: string): void {
    const yMap = this.itemsMap.get(itemId);

    if (!yMap) {
      console.warn(`Item ${itemId} not found`);
      return;
    }

    // Direct property update - LWW handles conflicts
    const currentChecked = yMap.get('checked') as boolean;
    yMap.set('checked', !currentChecked);
  }

  updateItem(itemId: string, updates: Partial<Omit<GroceryItem, 'id' | 'addedAt'>>): void {
    const yMap = this.itemsMap.get(itemId);

    if (!yMap) {
      console.warn(`Item ${itemId} not found`);
      return;
    }

    this.doc.transact(() => {
      if (updates.name !== undefined) {
        yMap.set('name', updates.name);
      }
      if (updates.checked !== undefined) {
        yMap.set('checked', updates.checked);
      }
      if (updates.addedBy !== undefined) {
        yMap.set('addedBy', updates.addedBy);
      }
    });
  }

  removeItem(itemId: string): void {
    this.itemsMap.delete(itemId);
  }

  onChange(callback: (items: GroceryItem[]) => void): () => void {
    this.observers.add(callback);

    // Return unsubscribe function to prevent memory leaks
    return () => {
      this.observers.delete(callback);
    };
  }

  clear(): void {
    this.doc.transact(() => {
      const keys = Array.from(this.itemsMap.keys());
      keys.forEach(key => this.itemsMap.delete(key));
    });
  }
}
